import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  type DocumentProps,
} from '@react-pdf/renderer';

export interface ReceiptData {
  receiptNo: string;
  paidAt: Date;
  amount: number;
  currency: string;
  method: string;
  gatewayRef?: string | null;
  school: { name: string; address?: string | null; phone?: string | null };
  invoice: { title: string; totalAmount: number; paidToDate: number };
  student: { firstName: string; lastName: string; rollNumber: string | null; className: string };
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  header: { marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#047857', paddingBottom: 12 },
  schoolName: { fontSize: 18, fontFamily: 'Helvetica-Bold' },
  sub: { fontSize: 9, color: '#6B7280', marginTop: 2 },
  badge: { marginTop: 8, fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#047857' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#6B7280', fontSize: 9 },
  value: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  amountBox: {
    marginTop: 18, padding: 16, backgroundColor: '#ECFDF5', borderRadius: 6,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  amountValue: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#047857' },
  section: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12 },
  footer: {
    position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#9CA3AF',
    borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 6, textAlign: 'center',
  },
});

function fmt(n: number, currency: string) {
  return `${currency === 'BDT' ? '৳' : currency + ' '}${n.toLocaleString('en-US')}`;
}

function ReceiptDocument({ data }: { data: ReceiptData }) {
  const { school, invoice, student } = data;
  const due = invoice.totalAmount - invoice.paidToDate;
  const el = React.createElement;
  return el(
    Document,
    null,
    el(
      Page,
      { size: 'A4', style: styles.page },
      el(
        View,
        { style: styles.header },
        el(Text, { style: styles.schoolName }, school.name),
        el(Text, { style: styles.sub }, [school.address, school.phone].filter(Boolean).join(' · ')),
        el(Text, { style: styles.badge }, 'PAYMENT RECEIPT'),
      ),
      el(View, { style: styles.row }, el(Text, { style: styles.label }, 'Receipt No.'), el(Text, { style: styles.value }, data.receiptNo)),
      el(View, { style: styles.row }, el(Text, { style: styles.label }, 'Date'),
        el(Text, { style: styles.value }, data.paidAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))),
      el(View, { style: styles.row }, el(Text, { style: styles.label }, 'Payment Method'), el(Text, { style: styles.value }, data.method.toUpperCase())),
      data.gatewayRef
        ? el(View, { style: styles.row }, el(Text, { style: styles.label }, 'Transaction Ref'), el(Text, { style: styles.value }, data.gatewayRef))
        : null,

      el(
        View,
        { style: styles.section },
        el(View, { style: styles.row }, el(Text, { style: styles.label }, 'Student'),
          el(Text, { style: styles.value }, `${student.firstName} ${student.lastName}`)),
        el(View, { style: styles.row }, el(Text, { style: styles.label }, 'Class'),
          el(Text, { style: styles.value }, `${student.className}${student.rollNumber ? ` · Roll ${student.rollNumber}` : ''}`)),
        el(View, { style: styles.row }, el(Text, { style: styles.label }, 'Fee'), el(Text, { style: styles.value }, invoice.title)),
      ),

      el(
        View,
        { style: styles.amountBox },
        el(Text, { style: styles.label }, 'Amount Paid'),
        el(Text, { style: styles.amountValue }, fmt(data.amount, data.currency)),
      ),
      el(
        View,
        { style: { marginTop: 10 } },
        el(View, { style: styles.row }, el(Text, { style: styles.label }, 'Invoice Total'), el(Text, { style: styles.value }, fmt(invoice.totalAmount, data.currency))),
        el(View, { style: styles.row }, el(Text, { style: styles.label }, 'Paid to Date'), el(Text, { style: styles.value }, fmt(invoice.paidToDate, data.currency))),
        el(View, { style: styles.row }, el(Text, { style: styles.label }, 'Balance Due'),
          el(Text, { style: { ...styles.value, color: due > 0 ? '#DC2626' : '#047857' } }, fmt(Math.max(0, due), data.currency))),
      ),

      el(Text, { style: styles.footer }, `This is a computer-generated receipt from ${school.name} · Powered by CampusFlow`),
    ),
  );
}

export async function generateReceiptPdf(data: ReceiptData): Promise<Buffer> {
  const doc = React.createElement(ReceiptDocument, { data });
  return renderToBuffer(doc as unknown as React.ReactElement<DocumentProps>);
}
