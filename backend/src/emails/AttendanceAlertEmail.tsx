import {
  Html, Head, Body, Container, Section, Text, Hr, Preview,
} from '@react-email/components';
import * as React from 'react';

interface Props {
  studentName: string;
  guardianName: string;
  schoolName: string;
  date: string;
  status: 'absent' | 'late' | 'excused';
  className: string;
  note?: string;
}

const STATUS_LABEL: Record<string, string> = {
  absent: 'Absent', late: 'Late Arrival', excused: 'Excused Absence',
};
const STATUS_COLOR: Record<string, string> = {
  absent: '#dc2626', late: '#d97706', excused: '#2563eb',
};

export default function AttendanceAlertEmail({
  studentName, guardianName, schoolName, date, status, className, note,
}: Props) {
  const label = STATUS_LABEL[status] ?? status;
  const color = STATUS_COLOR[status] ?? '#52525b';

  return (
    <Html>
      <Head />
      <Preview>Attendance alert for {studentName} on {date}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>{schoolName}</Text>
            <Text style={tagline}>Attendance Notification</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Dear {guardianName},</Text>
            <Text style={para}>
              We are writing to inform you about the attendance record for{' '}
              <strong>{studentName}</strong> ({className}) on {date}.
            </Text>

            <Section style={alertBox}>
              <Text style={{ ...statusBadge, backgroundColor: `${color}1a`, color }}>
                {label}
              </Text>
              {note && (
                <Text style={noteText}>Note: {note}</Text>
              )}
            </Section>

            <Text style={para}>
              If you have any questions, please contact the class teacher or school administration.
            </Text>

            <Hr style={divider} />
            <Text style={para}>Regards,<br />{schoolName}</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Automated attendance alert from {schoolName} via CampusFlow.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: '#f4f4f5',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
};
const container: React.CSSProperties = {
  maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff',
  borderRadius: '8px', overflow: 'hidden',
};
const header: React.CSSProperties = {
  backgroundColor: '#18181b', padding: '24px 32px',
};
const logo: React.CSSProperties = {
  color: '#ffffff', fontSize: '20px', fontWeight: 700, margin: 0,
};
const tagline: React.CSSProperties = {
  color: '#a1a1aa', fontSize: '12px', margin: '4px 0 0',
};
const content: React.CSSProperties = { padding: '32px' };
const greeting: React.CSSProperties = {
  fontSize: '16px', color: '#18181b', marginBottom: '8px',
};
const para: React.CSSProperties = {
  fontSize: '14px', color: '#52525b', lineHeight: '1.6', margin: '12px 0',
};
const alertBox: React.CSSProperties = {
  border: '1px solid #e4e4e7', borderRadius: '8px',
  padding: '16px 20px', margin: '16px 0',
};
const statusBadge: React.CSSProperties = {
  display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
  fontSize: '13px', fontWeight: 600, margin: 0,
};
const noteText: React.CSSProperties = {
  fontSize: '13px', color: '#71717a', margin: '8px 0 0',
};
const divider: React.CSSProperties = {
  borderColor: '#e4e4e7', margin: '20px 0',
};
const footer: React.CSSProperties = {
  backgroundColor: '#f4f4f5', padding: '16px 32px',
};
const footerText: React.CSSProperties = {
  fontSize: '11px', color: '#a1a1aa', textAlign: 'center', margin: 0,
};
