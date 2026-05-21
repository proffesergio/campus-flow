import {
  Html, Head, Body, Container, Section, Text, Button, Hr, Preview,
} from '@react-email/components';
import * as React from 'react';

interface Props {
  firstName: string;
  schoolName: string;
  role: string;
  email: string;
  temporaryPassword?: string;
  loginUrl: string;
}

const ROLE_LABEL: Record<string, string> = {
  school_admin: 'School Administrator',
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student',
  finance: 'Finance Staff',
};

export default function WelcomeEmail({
  firstName, schoolName, role, email, temporaryPassword, loginUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {schoolName} on CampusFlow</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>CampusFlow</Text>
            <Text style={tagline}>School Management System</Text>
          </Section>

          <Section style={content}>
            <Text style={headline}>Welcome, {firstName}!</Text>
            <Text style={para}>
              Your account has been created on <strong>{schoolName}</strong> as{' '}
              <strong>{ROLE_LABEL[role] ?? role}</strong>.
            </Text>

            <Section style={credBox}>
              <Text style={credLabel}>Your Login Credentials</Text>
              <Hr style={divider} />
              <Text style={credRow}><span style={credKey}>Email:</span> {email}</Text>
              {temporaryPassword && (
                <Text style={credRow}>
                  <span style={credKey}>Temporary Password:</span> {temporaryPassword}
                </Text>
              )}
            </Section>

            <Section style={{ textAlign: 'center', margin: '24px 0' }}>
              <Button href={loginUrl} style={button}>Login Now</Button>
            </Section>

            {temporaryPassword && (
              <Text style={warningText}>
                Please change your password after your first login for security.
              </Text>
            )}

            <Hr style={divider} />
            <Text style={para}>
              If you did not expect this email, please contact the school administration immediately.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} CampusFlow — School Management SaaS
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
  background: 'linear-gradient(135deg,#1e40af,#1d4ed8)', padding: '28px 32px',
};
const logo: React.CSSProperties = {
  color: '#ffffff', fontSize: '22px', fontWeight: 700, margin: 0,
};
const tagline: React.CSSProperties = {
  color: '#93c5fd', fontSize: '12px', margin: '4px 0 0',
};
const content: React.CSSProperties = { padding: '32px' };
const headline: React.CSSProperties = {
  fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px',
};
const para: React.CSSProperties = {
  fontSize: '14px', color: '#52525b', lineHeight: '1.6', margin: '12px 0',
};
const credBox: React.CSSProperties = {
  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
  borderRadius: '8px', padding: '16px 20px', margin: '20px 0',
};
const credLabel: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0,
};
const divider: React.CSSProperties = {
  borderColor: '#e2e8f0', margin: '12px 0',
};
const credRow: React.CSSProperties = {
  fontSize: '14px', color: '#0f172a', margin: '6px 0',
};
const credKey: React.CSSProperties = {
  fontWeight: 600, color: '#334155',
};
const button: React.CSSProperties = {
  backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 28px',
  borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
};
const warningText: React.CSSProperties = {
  fontSize: '12px', color: '#d97706', backgroundColor: '#fffbeb',
  border: '1px solid #fde68a', borderRadius: '6px',
  padding: '10px 14px', margin: '12px 0',
};
const footer: React.CSSProperties = {
  backgroundColor: '#f4f4f5', padding: '16px 32px',
};
const footerText: React.CSSProperties = {
  fontSize: '11px', color: '#a1a1aa', textAlign: 'center', margin: 0,
};
