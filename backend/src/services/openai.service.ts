import OpenAI from 'openai';
import { Response } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { startSSE } from './claude.service';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return client;
}

// ── Admin natural-language data query ─────────────────────────────────────────

export async function adminDataQuery(question: string, schoolId: string): Promise<string> {
  // Gather live school stats to give the model grounded context
  const [studentCount, activeStudents, pendingInvoices, overdueInvoices, recentAttendance] =
    await Promise.all([
      prisma.student.count({ where: { schoolId } }),
      prisma.student.count({ where: { schoolId, status: 'active' } }),
      prisma.invoice.aggregate({
        where: { schoolId, status: 'pending' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.invoice.aggregate({
        where: { schoolId, status: 'overdue' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: {
          schoolId,
          date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _count: { status: true },
      }),
    ]);

  const totalAtt = recentAttendance.reduce((s, g) => s + g._count.status, 0);
  const presentAtt = recentAttendance.find((g) => g.status === 'present')?._count.status ?? 0;
  const attPct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

  const context = `School data snapshot:
- Total students: ${studentCount} (${activeStudents} active)
- Pending fees: ৳${Number(pendingInvoices._sum.amount ?? 0).toLocaleString()} across ${pendingInvoices._count.id} invoices
- Overdue fees: ৳${Number(overdueInvoices._sum.amount ?? 0).toLocaleString()} across ${overdueInvoices._count.id} invoices
- Attendance last 30 days: ${attPct}% (${presentAtt}/${totalAtt} sessions)`;

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an AI assistant for a school administrator. Answer questions about school data clearly and concisely. Use the provided context. If the context doesn't contain enough information to answer, say so honestly. Format numbers clearly. Keep answers under 150 words.`,
      },
      { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` },
    ],
    max_tokens: 256,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content ?? 'Unable to generate a response.';
}

// ── Practice question generation ──────────────────────────────────────────────

// ── Student study assistant (SSE streaming) ───────────────────────────────────

export async function studyAssistantChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  userId: string,
  schoolId: string,
  res: Response,
) {
  startSSE(res);
  try {
    // Build student context from their record
    const student = await prisma.student.findFirst({
      where: { userId, schoolId },
      include: { class: { select: { name: true, section: true, academicYear: true } } },
    });

    const context = student
      ? `Student: ${student.firstName} ${student.lastName}, Class: ${student.class?.name ?? 'Unknown'}${student.class?.section ? ` ${student.class.section}` : ''}, Academic Year: ${student.class?.academicYear ?? 'current'}`
      : 'Student context unavailable';

    const stream = await getClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a friendly, encouraging AI study assistant for a school student in Bangladesh. ${context}. Help them understand concepts, solve problems, and prepare for exams. Keep answers clear and age-appropriate. Use examples they can relate to. If they ask about their grades or school-specific data, let them know you don't have direct access to that but can help them study.`,
        },
        ...messages,
      ],
      stream: true,
      max_tokens: 512,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : 'Chat failed' })}\n\n`);
    res.end();
  }
}

export interface PracticeQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export async function generatePracticeQuestions(
  subject: string,
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number,
  studentClass: string,
): Promise<PracticeQuestion[]> {
  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert teacher creating multiple-choice practice questions for ${studentClass} students in Bangladesh following the national curriculum. Return ONLY a valid JSON array — no markdown, no explanation outside the JSON.`,
      },
      {
        role: 'user',
        content: `Generate ${count} ${difficulty} multiple-choice questions about "${topic}" for the subject "${subject}".\n\nReturn this exact JSON structure:\n[\n  {\n    "question": "...",\n    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],\n    "correctAnswer": "A) ...",\n    "explanation": "Brief explanation why this is correct."\n  }\n]`,
      },
    ],
    max_tokens: 2048,
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0]?.message?.content ?? '{"questions":[]}';
  try {
    const parsed = JSON.parse(raw);
    // Handle both { questions: [...] } and [...] shapes
    const arr: PracticeQuestion[] = Array.isArray(parsed) ? parsed : (parsed.questions ?? []);
    return arr.slice(0, count);
  } catch {
    return [];
  }
}
