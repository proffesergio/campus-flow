import type { ReactElement } from 'react';
import { render } from '@react-email/render';
import { NotificationChannel, NotificationType, Prisma } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/prisma';

// ── Variable substitution ──────────────────────────────────────────────────────
export function substituteVariables(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

// ── Email via Resend ───────────────────────────────────────────────────────────
export async function sendEmail(opts: {
  to: string;
  subject: string;
  component: ReactElement;
}): Promise<{ ok: boolean; error?: string }> {
  if (!env.RESEND_API_KEY) {
    console.warn('[notifications] RESEND_API_KEY not set — skipping email to', opts.to);
    return { ok: false, error: 'Resend not configured' };
  }
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(env.RESEND_API_KEY);
    const html = await render(opts.component);
    const { error } = await resend.emails.send({
      from: env.RESEND_FROM,
      to: opts.to,
      subject: opts.subject,
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    console.error('[notifications] Email send failed:', err);
    return { ok: false, error: String(err) };
  }
}

// ── SMS via Twilio ─────────────────────────────────────────────────────────────
export async function sendSMS(opts: {
  to: string;
  body: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM) {
    console.warn('[notifications] Twilio not configured — skipping SMS to', opts.to);
    return { ok: false, error: 'Twilio not configured' };
  }
  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: opts.body,
      from: env.TWILIO_FROM,
      to: opts.to,
    });
    return { ok: true };
  } catch (err) {
    console.error('[notifications] SMS send failed:', err);
    return { ok: false, error: String(err) };
  }
}

// ── In-app notification ────────────────────────────────────────────────────────
export async function createInAppNotification(opts: {
  schoolId: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  link?: string;
}): Promise<void> {
  await prisma.inAppNotification.create({
    data: {
      schoolId: opts.schoolId,
      userId: opts.userId,
      title: opts.title,
      body: opts.body,
      type: opts.type,
      link: opts.link,
    },
  });
}

// ── Notification log ───────────────────────────────────────────────────────────
export async function logNotification(opts: {
  schoolId: string;
  senderId?: string;
  recipientId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  status: 'sent' | 'failed';
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.notificationLog.create({
    data: {
      schoolId: opts.schoolId,
      senderId: opts.senderId,
      recipientId: opts.recipientId,
      type: opts.type,
      channel: opts.channel,
      subject: opts.subject,
      body: opts.body,
      status: opts.status,
      metadata: opts.metadata,
      sentAt: new Date(),
    },
  });
}
