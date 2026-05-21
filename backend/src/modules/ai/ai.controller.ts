import { Request, Response, NextFunction } from 'express';
import * as claudeService from '../../services/claude.service';
import * as openaiService from '../../services/openai.service';
import {
  reportNarrativeSchema,
  attendanceSummarySchema,
  classInsightsSchema,
  adminQuerySchema,
  practiceQuestionsSchema,
  studyChatSchema,
} from './ai.validator';

// ── Claude: SSE streaming endpoints ──────────────────────────────────────────

export async function reportNarrative(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, term } = reportNarrativeSchema.parse(req.body);
    await claudeService.generateReportNarrative(studentId, term, req.user.schoolId, res);
  } catch (err) {
    // If headers not yet sent, delegate to error handler
    if (!res.headersSent) next(err);
    else res.end();
  }
}

export async function attendanceSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = attendanceSummarySchema.parse(req.body);
    await claudeService.generateAttendanceSummary(studentId, req.user.schoolId, res);
  } catch (err) {
    if (!res.headersSent) next(err);
    else res.end();
  }
}

export async function classInsights(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, term } = classInsightsSchema.parse(req.body);
    await claudeService.generateClassInsights(classId, term, req.user.schoolId, res);
  } catch (err) {
    if (!res.headersSent) next(err);
    else res.end();
  }
}

// ── OpenAI: regular JSON endpoints ───────────────────────────────────────────

export async function adminQuery(req: Request, res: Response, next: NextFunction) {
  try {
    const { question } = adminQuerySchema.parse(req.body);
    const answer = await openaiService.adminDataQuery(question, req.user.schoolId);
    res.json({ success: true, data: { answer } });
  } catch (err) {
    next(err);
  }
}

export async function generatePracticeQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const input = practiceQuestionsSchema.parse(req.body);
    const questions = await openaiService.generatePracticeQuestions(
      input.subject,
      input.topic,
      input.difficulty,
      input.count,
      input.studentClass,
    );
    res.json({ success: true, data: { questions } });
  } catch (err) {
    next(err);
  }
}

// ── OpenAI: SSE streaming — student study chat ────────────────────────────────

export async function studyChat(req: Request, res: Response, next: NextFunction) {
  try {
    const { messages } = studyChatSchema.parse(req.body);
    await openaiService.studyAssistantChat(messages, req.user.userId, req.tenant.schoolId, res);
  } catch (err) {
    if (!res.headersSent) next(err);
    else res.end();
  }
}
