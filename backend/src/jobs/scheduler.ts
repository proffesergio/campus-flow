import cron from 'node-cron';
import React from 'react';
import { prisma } from '../config/prisma';
import { sendEmail, sendSMS, logNotification, createInAppNotification } from '../services/notification.service';
import FeeReminderEmail from '../emails/FeeReminderEmail';
import AttendanceAlertEmail from '../emails/AttendanceAlertEmail';

const TZ = 'Asia/Dhaka';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Daily 8:00 AM — Fee reminders ─────────────────────────────────────────────
async function runFeeReminders(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const invoices = await prisma.invoice.findMany({
    where: {
      status: 'pending',
      dueDate: { gte: today, lt: tomorrow },
    },
    include: {
      student: { select: { firstName: true, lastName: true, guardianEmail: true, guardianPhone: true, guardianName: true } },
      school: { select: { name: true } },
    },
  });

  console.log(`[scheduler] Fee reminders: ${invoices.length} invoice(s) due today`);

  for (const inv of invoices) {
    const { student, school } = inv;
    const studentName = `${student.firstName} ${student.lastName}`;
    const amount = `৳${parseFloat(inv.amount.toString()).toLocaleString()}`;
    const dueDate = today.toLocaleDateString('en-BD');

    if (student.guardianEmail) {
      const result = await sendEmail({
        to: student.guardianEmail,
        subject: `Fee Reminder: ${inv.title} due today — ${school.name}`,
        component: React.createElement(FeeReminderEmail, {
          studentName,
          guardianName: student.guardianName ?? 'Guardian',
          schoolName: school.name,
          invoiceTitle: inv.title,
          amount,
          dueDate,
        }),
      });
      await logNotification({
        schoolId: inv.schoolId,
        type: 'fee_reminder',
        channel: 'email',
        subject: `Fee Reminder: ${inv.title}`,
        body: `Fee reminder sent to ${student.guardianEmail}`,
        status: result.ok ? 'sent' : 'failed',
        metadata: { invoiceId: inv.id, studentId: inv.studentId, error: result.error },
      });
    }

    if (student.guardianPhone) {
      const body = `[${school.name}] Fee reminder: ${inv.title} for ${studentName} is due today. Amount: ${amount}. Please pay at the earliest.`;
      const result = await sendSMS({ to: student.guardianPhone, body });
      await logNotification({
        schoolId: inv.schoolId,
        type: 'fee_reminder',
        channel: 'sms',
        body,
        status: result.ok ? 'sent' : 'failed',
        metadata: { invoiceId: inv.id, studentId: inv.studentId, error: result.error },
      });
    }
  }
}

// ── Daily 7:00 PM — Absence alerts ────────────────────────────────────────────
async function runAbsenceAlerts(): Promise<void> {
  const dateStr = todayStr();

  const absences = await prisma.attendance.findMany({
    where: {
      date: new Date(dateStr),
      status: 'absent',
    },
    include: {
      student: {
        select: { firstName: true, lastName: true, guardianPhone: true, guardianEmail: true, guardianName: true },
      },
      class: { select: { name: true, section: true } },
      school: { select: { name: true } },
    },
  });

  console.log(`[scheduler] Absence alerts: ${absences.length} absence(s) today`);

  for (const att of absences) {
    const { student, class: cls, school } = att;
    const studentName = `${student.firstName} ${student.lastName}`;
    const className = `${cls.name}${cls.section ? ` – ${cls.section}` : ''}`;

    if (student.guardianPhone) {
      const body = `[${school.name}] ${studentName} (${className}) was ABSENT on ${dateStr}. If this is an error, please contact the school.`;
      const result = await sendSMS({ to: student.guardianPhone, body });
      await logNotification({
        schoolId: att.schoolId,
        type: 'attendance_alert',
        channel: 'sms',
        body,
        status: result.ok ? 'sent' : 'failed',
        metadata: { attendanceId: att.id, studentId: att.studentId, error: result.error },
      });
    }

    if (student.guardianEmail) {
      const result = await sendEmail({
        to: student.guardianEmail,
        subject: `Attendance Alert: ${studentName} was absent on ${dateStr}`,
        component: React.createElement(AttendanceAlertEmail, {
          studentName,
          guardianName: student.guardianName ?? 'Guardian',
          schoolName: school.name,
          date: dateStr,
          status: 'absent',
          className,
        }),
      });
      await logNotification({
        schoolId: att.schoolId,
        type: 'attendance_alert',
        channel: 'email',
        subject: `Attendance Alert: ${studentName}`,
        body: `Absence alert sent to ${student.guardianEmail}`,
        status: result.ok ? 'sent' : 'failed',
        metadata: { attendanceId: att.id, studentId: att.studentId, error: result.error },
      });
    }

    // In-app notification for the student (if they have a user account)
    const studentUser = await prisma.student.findUnique({
      where: { id: att.studentId },
      select: { userId: true },
    });
    if (studentUser?.userId) {
      await createInAppNotification({
        schoolId: att.schoolId,
        userId: studentUser.userId,
        title: 'Attendance Marked: Absent',
        body: `Your attendance for ${dateStr} in ${className} has been recorded as absent.`,
        type: 'attendance_alert',
      });
    }
  }
}

// ── Exported start function ────────────────────────────────────────────────────
export function startScheduler(): void {
  // 8:00 AM daily — fee reminders
  cron.schedule('0 8 * * *', () => {
    runFeeReminders().catch((err) => console.error('[scheduler] Fee reminders failed:', err));
  }, { timezone: TZ });

  // 7:00 PM daily — absence alerts
  cron.schedule('0 19 * * *', () => {
    runAbsenceAlerts().catch((err) => console.error('[scheduler] Absence alerts failed:', err));
  }, { timezone: TZ });

  console.log('[scheduler] Started — Asia/Dhaka timezone');
}
