import {
  Html, Head, Body, Container, Section, Text, Button, Hr, Preview,
} from '@react-email/components';
import * as React from 'react';

interface Props {
  studentName: string;
  guardianName: string;
  schoolName: string;
  invoiceTitle: string;
  amount: string;
  dueDate: string;
  paymentUrl?: string;
}

export default function FeeReminderEmail({
  studentName,
  guardianName,
  schoolName,
  invoiceTitle,
  amount,
  dueDate,
  paymentUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Fee payment reminder for {studentName} — {invoiceTitle}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>{schoolName}</Text>
            <Text style={tagline}>School Management System</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Dear {guardianName},</Text>
            <Text style={para}>
              This is a reminder that the following fee is due for{' '}
              <strong>{studentName}</strong>:
            </Text>

            <Section style={feeBox}>
              <Text style={feeLabel}>Fee</Text>
              <Text style={feeTitle}>{invoiceTitle}</Text>
              <Hr style={divider} />
              <Section style={row}>
                <Text style={rowLabel}>Amount Due</Text>
                <Text style={rowValue}>{amount}</Text>
              </Section>
              <Section style={row}>
                <Text style={rowLabel}>Due Date</Text>
                <Text style={rowValueWarn}>{dueDate}</Text>
              </Section>
            </Section>

            {paymentUrl && (
              <Section style={{ textAlign: 'center', margin: '24px 0' }}>
                <Button href={paymentUrl} style={button}>
                  Pay Now
                </Button>
              </Section>
            )}

            <Text style={para}>
              If you have already made the payment, please disregard this message.
              For any queries, please contact the school administration.
            </Text>

            <Text style={para}>Thank you,<br />{schoolName}</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This is an automated message from {schoolName} via CampusFlow.
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
  backgroundColor: '#1e40af', padding: '24px 32px',
};
const logo: React.CSSProperties = {
  color: '#ffffff', fontSize: '20px', fontWeight: 700, margin: 0,
};
const tagline: React.CSSProperties = {
  color: '#93c5fd', fontSize: '12px', margin: '4px 0 0',
};
const content: React.CSSProperties = {
  padding: '32px',
};
const greeting: React.CSSProperties = {
  fontSize: '16px', color: '#18181b', marginBottom: '8px',
};
const para: React.CSSProperties = {
  fontSize: '14px', color: '#52525b', lineHeight: '1.6', margin: '12px 0',
};
const feeBox: React.CSSProperties = {
  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
  borderRadius: '8px', padding: '16px 20px', margin: '20px 0',
};
const feeLabel: React.CSSProperties = {
  fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase',
  letterSpacing: '0.05em', margin: 0,
};
const feeTitle: React.CSSProperties = {
  fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: '4px 0 0',
};
const divider: React.CSSProperties = {
  borderColor: '#e2e8f0', margin: '12px 0',
};
const row: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', margin: '6px 0',
};
const rowLabel: React.CSSProperties = {
  fontSize: '13px', color: '#64748b', margin: 0,
};
const rowValue: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0,
};
const rowValueWarn: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: '#dc2626', margin: 0,
};
const button: React.CSSProperties = {
  backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 28px',
  borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
};
const footer: React.CSSProperties = {
  backgroundColor: '#f4f4f5', padding: '16px 32px',
};
const footerText: React.CSSProperties = {
  fontSize: '11px', color: '#a1a1aa', textAlign: 'center', margin: 0,
};
