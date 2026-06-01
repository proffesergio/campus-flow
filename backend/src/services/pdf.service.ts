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

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
    paddingBottom: 12,
  },
  schoolName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  reportTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  studentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 4,
  },
  infoGroup: {
    flexDirection: 'column',
    gap: 3,
  },
  infoLabel: {
    color: '#6B7280',
    fontSize: 8,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    color: 'white',
    padding: '6 8',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: '5 8',
    fontSize: 9,
  },
  tableRowAlt: {
    backgroundColor: '#F9FAFB',
  },
  colSubject: { width: '22%' },
  colExam: { width: '22%' },
  colType: { width: '14%' },
  colMarks: { width: '14%', textAlign: 'center' },
  colPercent: { width: '12%', textAlign: 'center' },
  colGrade: { width: '8%', textAlign: 'center' },
  colRemarks: { width: '8%', textAlign: 'center' },
  summaryBox: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
    padding: 10,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1D4ED8',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#9CA3AF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 6,
  },
  aiNarrative: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
    fontSize: 9,
    lineHeight: 1.5,
    color: '#374151',
  },
  aiNarrativeTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#15803D',
    marginBottom: 4,
  },
});

interface ReportCardData {
  student: {
    firstName: string;
    lastName: string;
    rollNumber: string | null;
    class: { name: string; section: string | null; academicYear: string };
  };
  term: string;
  grades: Array<{
    marksObtained: number | null;
    isAbsent: boolean;
    grade: string | null;
    remarks: string | null;
    exam: {
      name: string;
      examType: string;
      totalMarks: number;
      term: string;
      subject: { name: string; code: string | null };
    };
  }>;
  summary: {
    totalObtained: number;
    totalPossible: number;
    overallPercent: number | null;
    overallGrade: string | null;
    classRank: number | null;
    classSize: number;
  };
  aiNarrative?: string;
}

interface School {
  name: string;
  primaryColor: string;
}

function ReportCardDocument({
  school,
  data,
}: {
  school: School;
  data: ReportCardData;
}) {
  const { student, term, grades, summary, aiNarrative } = data;
  const className = student.class.section
    ? `${student.class.name} – ${student.class.section}`
    : student.class.name;

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },

      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.schoolName }, school.name),
        React.createElement(
          Text,
          { style: styles.reportTitle },
          `Academic Report Card — ${term}`,
        ),
      ),

      // Student info
      React.createElement(
        View,
        { style: styles.studentSection },
        React.createElement(
          View,
          { style: styles.infoGroup },
          React.createElement(Text, { style: styles.infoLabel }, 'Student Name'),
          React.createElement(
            Text,
            { style: styles.infoValue },
            `${student.firstName} ${student.lastName}`,
          ),
        ),
        React.createElement(
          View,
          { style: styles.infoGroup },
          React.createElement(Text, { style: styles.infoLabel }, 'Class'),
          React.createElement(Text, { style: styles.infoValue }, className),
        ),
        React.createElement(
          View,
          { style: styles.infoGroup },
          React.createElement(Text, { style: styles.infoLabel }, 'Roll Number'),
          React.createElement(
            Text,
            { style: styles.infoValue },
            student.rollNumber ?? '—',
          ),
        ),
        React.createElement(
          View,
          { style: styles.infoGroup },
          React.createElement(Text, { style: styles.infoLabel }, 'Academic Year'),
          React.createElement(
            Text,
            { style: styles.infoValue },
            student.class.academicYear,
          ),
        ),
      ),

      // Table header
      React.createElement(
        View,
        { style: styles.tableHeader },
        React.createElement(Text, { style: styles.colSubject }, 'Subject'),
        React.createElement(Text, { style: styles.colExam }, 'Exam'),
        React.createElement(Text, { style: styles.colType }, 'Type'),
        React.createElement(Text, { style: styles.colMarks }, 'Marks'),
        React.createElement(Text, { style: styles.colPercent }, '%'),
        React.createElement(Text, { style: styles.colGrade }, 'Grade'),
        React.createElement(Text, { style: styles.colRemarks }, 'Remarks'),
      ),

      // Table rows
      ...grades.map((g, i) => {
        const percent =
          !g.isAbsent && g.marksObtained != null
            ? `${Math.round((g.marksObtained / g.exam.totalMarks) * 100)}%`
            : g.isAbsent
            ? 'AB'
            : '—';
        const marksDisplay = g.isAbsent
          ? 'Absent'
          : g.marksObtained != null
          ? `${g.marksObtained} / ${g.exam.totalMarks}`
          : '—';

        return React.createElement(
          View,
          { key: i, style: [styles.tableRow, ...(i % 2 === 1 ? [styles.tableRowAlt] : [])] },
          React.createElement(Text, { style: styles.colSubject }, g.exam.subject.name),
          React.createElement(Text, { style: styles.colExam }, g.exam.name),
          React.createElement(
            Text,
            { style: styles.colType },
            g.exam.examType.replace('_', ' '),
          ),
          React.createElement(Text, { style: styles.colMarks }, marksDisplay),
          React.createElement(Text, { style: styles.colPercent }, percent),
          React.createElement(Text, { style: styles.colGrade }, g.grade ?? '—'),
          React.createElement(Text, { style: styles.colRemarks }, g.remarks ?? ''),
        );
      }),

      // Summary cards
      React.createElement(
        View,
        { style: styles.summaryBox },
        React.createElement(
          View,
          { style: styles.summaryCard },
          React.createElement(
            Text,
            { style: styles.summaryValue },
            summary.overallPercent != null ? `${summary.overallPercent}%` : '—',
          ),
          React.createElement(Text, { style: styles.summaryLabel }, 'Overall'),
        ),
        React.createElement(
          View,
          { style: styles.summaryCard },
          React.createElement(
            Text,
            { style: styles.summaryValue },
            summary.overallGrade ?? '—',
          ),
          React.createElement(Text, { style: styles.summaryLabel }, 'Grade'),
        ),
        React.createElement(
          View,
          { style: styles.summaryCard },
          React.createElement(
            Text,
            { style: styles.summaryValue },
            summary.classRank != null ? `${summary.classRank}/${summary.classSize}` : '—',
          ),
          React.createElement(Text, { style: styles.summaryLabel }, 'Class Rank'),
        ),
        React.createElement(
          View,
          { style: styles.summaryCard },
          React.createElement(
            Text,
            { style: styles.summaryValue },
            `${summary.totalObtained}/${summary.totalPossible}`,
          ),
          React.createElement(Text, { style: styles.summaryLabel }, 'Total Marks'),
        ),
      ),

      // AI narrative section (if present)
      ...(aiNarrative
        ? [
            React.createElement(
              View,
              { style: styles.aiNarrative },
              React.createElement(
                Text,
                { style: styles.aiNarrativeTitle },
                'AI Performance Narrative',
              ),
              React.createElement(Text, null, aiNarrative),
            ),
          ]
        : []),

      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, null, `Generated by CampusFlow · ${school.name}`),
        React.createElement(
          Text,
          null,
          new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
        ),
      ),
    ),
  );
}

export async function generateReportCardPdf(
  school: School,
  data: ReportCardData,
): Promise<Buffer> {
  const doc = React.createElement(ReportCardDocument, { school, data });
  return renderToBuffer(doc as unknown as React.ReactElement<DocumentProps>);
}
