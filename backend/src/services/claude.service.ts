import Anthropic from '@anthropic-ai/sdk';
import { Response } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured');
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}

// ── SSE helpers ───────────────────────────────────────────────────────────────

export function startSSE(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
}

function sendChunk(res: Response, text: string) {
  res.write(`data: ${JSON.stringify({ text })}\n\n`);
}

function sendDone(res: Response) {
  res.write('data: [DONE]\n\n');
  res.end();
}

function sendError(res: Response, message: string) {
  res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
  res.end();
}

// ── Data fetchers ─────────────────────────────────────────────────────────────

async function fetchStudentContext(studentId: string, term: string, schoolId: string) {
  const [student, grades, attendanceGroups] = await Promise.all([
    prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: { class: { select: { name: true, section: true } } },
    }),
    prisma.grade.findMany({
      where: {
        studentId,
        schoolId,
        exam: { term },
      },
      include: {
        exam: {
          include: { subject: { select: { name: true } } },
        },
      },
      orderBy: { exam: { subject: { name: 'asc' } } },
    }),
    prisma.attendance.groupBy({
      by: ['status'],
      where: { studentId, schoolId },
      _count: { status: true },
    }),
  ]);

  if (!student) throw new Error('Student not found');

  const totalAttendance = attendanceGroups.reduce((s, g) => s + g._count.status, 0);
  const present = attendanceGroups.find((g) => g.status === 'present')?._count.status ?? 0;
  const attendancePct = totalAttendance > 0 ? Math.round((present / totalAttendance) * 100) : 0;

  const gradeSummary = grades.map((g) => {
    const pct = g.marksObtained != null
      ? Math.round((Number(g.marksObtained) / g.exam.totalMarks) * 100)
      : null;
    return `${g.exam.subject?.name ?? 'Unknown'}: ${g.isAbsent ? 'Absent' : `${g.marksObtained ?? '—'}/${g.exam.totalMarks} (${pct ?? '—'}%) — Grade ${g.grade ?? '—'}`}`;
  }).join('\n');

  const validGrades = grades.filter((g) => !g.isAbsent && g.marksObtained != null);
  const avgPct = validGrades.length > 0
    ? Math.round(validGrades.reduce((s, g) => s + (Number(g.marksObtained) / g.exam.totalMarks) * 100, 0) / validGrades.length)
    : 0;

  return { student, gradeSummary, attendancePct, avgPct, term };
}

// ── Generators ────────────────────────────────────────────────────────────────

export async function generateReportNarrative(
  studentId: string,
  term: string,
  schoolId: string,
  res: Response,
) {
  startSSE(res);
  try {
    const ctx = await fetchStudentContext(studentId, term, schoolId);
    const { student, gradeSummary, attendancePct, avgPct } = ctx;
    const name = `${student.firstName} ${student.lastName}`;
    const className = student.class ? `${student.class.name}${student.class.section ? ` ${student.class.section}` : ''}` : 'their class';

    const systemPrompt = `You are a school report card writer for a Bangladesh school. Write warm, professional, encouraging report card narratives in 2-3 paragraphs. Use the student's first name. Be specific about their performance. Highlight strengths, note areas for improvement diplomatically. Keep it between 120-180 words. Write in English.`;

    const userPrompt = `Write a report card narrative for ${name} (${className}) for ${term}.\n\nGrade summary:\n${gradeSummary || 'No grades recorded yet.'}\n\nOverall average: ${avgPct}%\nAttendance: ${attendancePct}%`;

    const stream = getClient().messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userPrompt }],
    });

    stream.on('text', (text) => sendChunk(res, text));
    await stream.finalMessage();
    sendDone(res);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Generation failed');
  }
}

export async function generateAttendanceSummary(
  studentId: string,
  schoolId: string,
  res: Response,
) {
  startSSE(res);
  try {
    const [student, groups] = await Promise.all([
      prisma.student.findFirst({ where: { id: studentId, schoolId } }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: { studentId, schoolId },
        _count: { status: true },
      }),
    ]);

    if (!student) { sendError(res, 'Student not found'); return; }

    const total = groups.reduce((s, g) => s + g._count.status, 0);
    const present = groups.find((g) => g.status === 'present')?._count.status ?? 0;
    const absent  = groups.find((g) => g.status === 'absent')?._count.status ?? 0;
    const late    = groups.find((g) => g.status === 'late')?._count.status ?? 0;
    const pct     = total > 0 ? Math.round((present / total) * 100) : 0;

    const userPrompt = `Write a 1-2 sentence parent-friendly attendance summary for ${student.firstName} ${student.lastName}.\nStats: ${present} present, ${absent} absent, ${late} late out of ${total} school days (${pct}% attendance rate).\nBe encouraging if attendance is good (≥85%), or gently raise concern if below that.`;

    const stream = getClient().messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 128,
      system: [{ type: 'text', text: 'You write brief, warm, parent-friendly school attendance summaries in 1-2 sentences.', cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userPrompt }],
    });

    stream.on('text', (text) => sendChunk(res, text));
    await stream.finalMessage();
    sendDone(res);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Generation failed');
  }
}

export async function generateClassInsights(
  classId: string,
  term: string,
  schoolId: string,
  res: Response,
) {
  startSSE(res);
  try {
    const [cls, grades] = await Promise.all([
      prisma.class.findFirst({ where: { id: classId, schoolId } }),
      prisma.grade.findMany({
        where: { schoolId, exam: { classId, term } },
        include: {
          student: { select: { firstName: true, lastName: true } },
          exam: { include: { subject: { select: { name: true } } } },
        },
      }),
    ]);

    if (!cls) { sendError(res, 'Class not found'); return; }

    const studentScores: Record<string, { name: string; scores: number[] }> = {};
    for (const g of grades) {
      if (g.isAbsent || g.marksObtained == null) continue;
      const key = g.studentId;
      if (!studentScores[key]) studentScores[key] = { name: `${g.student.firstName} ${g.student.lastName}`, scores: [] };
      studentScores[key].scores.push((Number(g.marksObtained) / g.exam.totalMarks) * 100);
    }

    const ranked = Object.values(studentScores)
      .map((s) => ({ name: s.name, avg: Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) }))
      .sort((a, b) => b.avg - a.avg);

    const classAvg = ranked.length > 0
      ? Math.round(ranked.reduce((s, r) => s + r.avg, 0) / ranked.length)
      : 0;

    const top3 = ranked.slice(0, 3).map((r) => `${r.name} (${r.avg}%)`).join(', ');
    const atRisk = ranked.filter((r) => r.avg < 50).map((r) => r.name).join(', ');

    const userPrompt = `Write a 2-paragraph class performance insight for ${cls.name}${cls.section ? ` ${cls.section}` : ''} for ${term}.\nClass average: ${classAvg}%\nTop performers: ${top3 || 'None recorded'}\nAt-risk students (below 50%): ${atRisk || 'None'}\nTotal students with grades: ${ranked.length}\n\nFirst paragraph: overall class performance. Second paragraph: top performers and any at-risk students.`;

    const stream = getClient().messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: [{ type: 'text', text: 'You write concise, professional class performance insights for school administrators in 2 paragraphs.', cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userPrompt }],
    });

    stream.on('text', (text) => sendChunk(res, text));
    await stream.finalMessage();
    sendDone(res);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Generation failed');
  }
}
