'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Calendar, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

interface StudentProfile {
  id: string; firstName: string; lastName: string; rollNumber: string | null;
  dateOfBirth: string | null; gender: string | null; address: string | null;
  status: string; enrollmentDate: string | null; photoUrl: string | null;
  guardianName: string | null; guardianPhone: string | null; guardianEmail: string | null;
  bloodGroup: string | null;
  class: { id: string; name: string; section: string | null; academicYear: string } | null;
  attendancePercent?: number;
  recentGrades?: { subject: string; exam: string; grade: string; marks: number; total: number }[];
}

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400',
  inactive: 'bg-zinc-700 text-zinc-400',
  graduated: 'bg-blue-500/10 text-blue-400',
};

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    api.get<{ success: boolean; data: StudentProfile }>(`/students/${id}/profile`)
      .then((r) => setStudent(r.data.data))
      .catch(() => toast.error('Failed to load student'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48 bg-zinc-800" />
        <Skeleton className="h-32 bg-zinc-800 rounded-xl" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 text-center">
        <p className="text-zinc-400">Student not found.</p>
        <Link href="/dashboard/students" className="text-blue-400 text-sm hover:underline mt-2 block">
          Back to students
        </Link>
      </div>
    );
  }

  const initials = `${student.firstName[0]}${student.lastName[0]}`;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Back */}
      <Link href="/dashboard/students" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </Link>

      {/* Header card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt={initials} className="w-full h-full rounded-xl object-cover" />
            ) : initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{student.firstName} {student.lastName}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[student.status] ?? STATUS_STYLE.inactive}`}>
                {student.status}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {student.class && (
                <span className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <Users className="w-3.5 h-3.5" />
                  {student.class.name}{student.class.section ? ` – ${student.class.section}` : ''}
                </span>
              )}
              {student.rollNumber && (
                <span className="text-sm text-zinc-400">Roll #{student.rollNumber}</span>
              )}
              {student.attendancePercent !== undefined && (
                <span className={`text-sm font-medium ${student.attendancePercent >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {student.attendancePercent.toFixed(1)}% attendance
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/dashboard/students/${id}/report-card`}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            Report Card
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {['overview', 'grades'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
              tab === t ? 'border-blue-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Personal Info</h3>
            {[
              { label: 'Date of Birth', value: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : null, icon: Calendar },
              { label: 'Gender', value: student.gender, icon: Users },
              { label: 'Blood Group', value: student.bloodGroup, icon: Users },
              { label: 'Address', value: student.address, icon: MapPin },
            ].map(({ label, value, icon: Icon }) => value ? (
              <div key={label} className="flex items-start gap-3">
                <Icon className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-zinc-500">{label}</p>
                  <p className="text-sm text-zinc-200">{value}</p>
                </div>
              </div>
            ) : null)}
          </div>

          {/* Guardian info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Guardian Info</h3>
            {[
              { label: 'Name', value: student.guardianName, icon: Users },
              { label: 'Phone', value: student.guardianPhone, icon: Phone },
              { label: 'Email', value: student.guardianEmail, icon: Mail },
            ].map(({ label, value, icon: Icon }) => value ? (
              <div key={label} className="flex items-start gap-3">
                <Icon className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-zinc-500">{label}</p>
                  <p className="text-sm text-zinc-200">{value}</p>
                </div>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {tab === 'grades' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Subject', 'Exam', 'Marks', 'Grade'].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(student.recentGrades ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 text-sm">
                    No grades recorded yet
                  </td>
                </tr>
              ) : student.recentGrades!.map((g, i) => (
                <tr key={i} className="border-b border-zinc-800/50">
                  <td className="px-4 py-3 text-sm text-zinc-300">{g.subject}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{g.exam}</td>
                  <td className="px-4 py-3 text-sm text-zinc-300">{g.marks}/{g.total}</td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-400">{g.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
