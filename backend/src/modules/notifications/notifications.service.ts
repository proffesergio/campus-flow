import { prisma } from '../../config/prisma';
import {
  sendSMS, createInAppNotification,
  logNotification, substituteVariables,
} from '../../services/notification.service';
import type { BroadcastInput, NotifyStudentsInput } from './notifications.validator';

interface Recipient {
  userId: string;
  email: string | null;
  phone: string | null;
  name: string;
}

async function resolveRecipients(schoolId: string, input: BroadcastInput): Promise<Recipient[]> {
  const { targetGroup, classId, role } = input;

  if (targetGroup === 'all_parents') {
    const students = await prisma.student.findMany({
      where: { schoolId, status: 'active', guardianEmail: { not: null } },
      select: { id: true, firstName: true, lastName: true, guardianEmail: true, guardianPhone: true, userId: true },
    });
    return students.map((s) => ({
      userId: s.userId ?? s.id,
      email: s.guardianEmail,
      phone: s.guardianPhone,
      name: `${s.firstName} ${s.lastName} Guardian`,
    }));
  }

  if (targetGroup === 'specific_class' && classId) {
    const students = await prisma.student.findMany({
      where: { schoolId, classId, status: 'active' },
      select: { id: true, firstName: true, lastName: true, guardianEmail: true, guardianPhone: true, userId: true },
    });
    return students.map((s) => ({
      userId: s.userId ?? s.id,
      email: s.guardianEmail,
      phone: s.guardianPhone,
      name: `${s.firstName} ${s.lastName} Guardian`,
    }));
  }

  const roleFilter = targetGroup === 'all_teachers' ? 'teacher'
    : targetGroup === 'all_students' ? 'student'
    : targetGroup === 'specific_role' && role ? role
    : null;

  if (roleFilter) {
    const users = await prisma.user.findMany({
      where: { schoolId, role: roleFilter as never, isActive: true },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    });
    return users.map((u) => ({
      userId: u.id,
      email: u.email,
      phone: u.phone,
      name: `${u.firstName} ${u.lastName}`,
    }));
  }

  return [];
}

export async function sendBroadcast(
  schoolId: string,
  senderId: string,
  input: BroadcastInput,
): Promise<{ sent: number; failed: number }> {
  const recipients = await resolveRecipients(schoolId, input);
  const vars = input.variables ?? {};

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const personalVars = { ...vars, recipientName: recipient.name };
    const body = substituteVariables(input.message, personalVars);
    const subject = substituteVariables(input.subject, personalVars);

    for (const channel of input.channels) {
      let ok = false;

      if (channel === 'in_app') {
        await createInAppNotification({
          schoolId,
          userId: recipient.userId,
          title: subject,
          body,
          type: 'broadcast',
        });
        ok = true;
      } else if (channel === 'email' && recipient.email) {
        // Plain text email for broadcasts
        const { Resend } = await import('resend');
        const { env } = await import('../../config/env');
        if (env.RESEND_API_KEY) {
          const resend = new Resend(env.RESEND_API_KEY);
          const res = await resend.emails.send({
            from: env.RESEND_FROM,
            to: recipient.email,
            subject,
            text: body,
          });
          ok = !res.error;
        }
      } else if (channel === 'sms' && recipient.phone) {
        const result = await sendSMS({ to: recipient.phone, body });
        ok = result.ok;
      }

      await logNotification({
        schoolId,
        senderId,
        recipientId: recipient.userId,
        type: 'broadcast',
        channel: channel as 'email' | 'sms' | 'in_app',
        subject,
        body,
        status: ok ? 'sent' : 'failed',
      });

      if (ok) sent++; else failed++;
    }
  }

  return { sent, failed };
}

/** Send a notice to the guardians of a specific set of students (tenant-scoped). */
export async function notifyStudents(
  schoolId: string,
  senderId: string,
  input: NotifyStudentsInput,
): Promise<{ sent: number; failed: number }> {
  const students = await prisma.student.findMany({
    where: { id: { in: input.studentIds }, schoolId, status: 'active' },
    select: { id: true, firstName: true, lastName: true, guardianEmail: true, guardianPhone: true, userId: true },
  });
  const recipients: Recipient[] = students.map((s) => ({
    userId: s.userId ?? s.id,
    email: s.guardianEmail,
    phone: s.guardianPhone,
    name: `${s.firstName} ${s.lastName} Guardian`,
  }));

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const body = substituteVariables(input.message, { recipientName: recipient.name });
    const subject = substituteVariables(input.subject, { recipientName: recipient.name });

    for (const channel of input.channels) {
      let ok = false;
      if (channel === 'in_app') {
        await createInAppNotification({ schoolId, userId: recipient.userId, title: subject, body, type: 'broadcast' });
        ok = true;
      } else if (channel === 'email' && recipient.email) {
        const { Resend } = await import('resend');
        const { env } = await import('../../config/env');
        if (env.RESEND_API_KEY) {
          const resend = new Resend(env.RESEND_API_KEY);
          const res = await resend.emails.send({ from: env.RESEND_FROM, to: recipient.email, subject, text: body });
          ok = !res.error;
        }
      } else if (channel === 'sms' && recipient.phone) {
        const result = await sendSMS({ to: recipient.phone, body });
        ok = result.ok;
      }

      await logNotification({
        schoolId, senderId, recipientId: recipient.userId,
        type: 'broadcast', channel: channel as 'email' | 'sms' | 'in_app',
        subject, body, status: ok ? 'sent' : 'failed',
      });
      if (ok) sent++; else failed++;
    }
  }

  return { sent, failed };
}

export async function getNotificationLogs(schoolId: string, opts: {
  page: number; limit: number; channel?: string; type?: string;
}) {
  const { page, limit, channel, type } = opts;
  const skip = (page - 1) * limit;

  const where = {
    schoolId,
    ...(channel ? { channel: channel as never } : {}),
    ...(type ? { type: type as never } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.notificationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        recipient: { select: { firstName: true, lastName: true, email: true } },
        sender: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.notificationLog.count({ where }),
  ]);

  return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getInbox(userId: string, schoolId: string) {
  const [items, unread] = await Promise.all([
    prisma.inAppNotification.findMany({
      where: { userId, schoolId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.inAppNotification.count({ where: { userId, schoolId, isRead: false } }),
  ]);
  return { items, unread };
}

export async function markRead(id: string, userId: string): Promise<void> {
  await prisma.inAppNotification.updateMany({
    where: { id, userId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllRead(userId: string, schoolId: string): Promise<void> {
  await prisma.inAppNotification.updateMany({
    where: { userId, schoolId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function registerDevice(opts: {
  userId: string; schoolId: string; pushToken: string; platform: string;
}): Promise<void> {
  await prisma.device.upsert({
    where: { userId_pushToken: { userId: opts.userId, pushToken: opts.pushToken } },
    update: { schoolId: opts.schoolId, platform: opts.platform as never },
    create: {
      userId: opts.userId,
      schoolId: opts.schoolId,
      pushToken: opts.pushToken,
      platform: opts.platform as never,
    },
  });
}
