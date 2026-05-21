'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getInitials } from '@/lib/utils';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

interface StudentRow {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string | null;
  photoUrl: string | null;
  attendance: { status: AttendanceStatus } | null;
}

interface Props {
  students: StudentRow[];
  records: Map<string, AttendanceRecord>;
  onChange: (studentId: string, status: AttendanceStatus) => void;
  readOnly?: boolean;
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; active: string; dot: string }> = {
  present: {
    label: 'P',
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 ring-1 ring-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  absent: {
    label: 'A',
    active: 'bg-red-500/20 text-red-400 border-red-500/40 ring-1 ring-red-500/30',
    dot: 'bg-red-500',
  },
  late: {
    label: 'L',
    active: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40 ring-1 ring-yellow-500/30',
    dot: 'bg-yellow-500',
  },
  excused: {
    label: 'E',
    active: 'bg-blue-500/20 text-blue-400 border-blue-500/40 ring-1 ring-blue-500/30',
    dot: 'bg-blue-500',
  },
};

const STATUSES: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

export default function AttendanceGrid({ students, records, onChange, readOnly = false }: Props) {
  const present = [...records.values()].filter((r) => r.status === 'present').length;
  const total = students.length;

  return (
    <div className="space-y-1">
      {/* Progress bar */}
      {!readOnly && total > 0 && (
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(records.size / total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs text-zinc-500 tabular-nums whitespace-nowrap">
            {records.size}/{total} marked · {present} present
          </span>
        </div>
      )}

      {students.map((student, i) => {
        const record = records.get(student.id);
        const currentStatus = record?.status ?? student.attendance?.status ?? null;

        return (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.025, duration: 0.2 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/40 transition-colors group"
          >
            {/* Index */}
            <span className="text-xs text-zinc-600 w-5 text-right flex-shrink-0">{i + 1}</span>

            {/* Avatar */}
            <Avatar className="h-8 w-8 flex-shrink-0">
              {student.photoUrl && <AvatarImage src={student.photoUrl} />}
              <AvatarFallback className="text-xs">
                {getInitials(student.firstName, student.lastName)}
              </AvatarFallback>
            </Avatar>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-100 font-medium leading-tight">
                {student.firstName} {student.lastName}
              </p>
              {student.rollNumber && (
                <p className="text-xs text-zinc-600">Roll {student.rollNumber}</p>
              )}
            </div>

            {/* Status indicator (read-only) or buttons */}
            {readOnly && currentStatus ? (
              <div className={cn('flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium', STATUS_CONFIG[currentStatus].active)}>
                <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_CONFIG[currentStatus].dot)} />
                {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {STATUSES.map((status) => {
                  const cfg = STATUS_CONFIG[status];
                  const isActive = currentStatus === status;
                  return (
                    <motion.button
                      key={status}
                      type="button"
                      onClick={() => !readOnly && onChange(student.id, status)}
                      whileTap={readOnly ? {} : { scale: 0.9 }}
                      title={status.charAt(0).toUpperCase() + status.slice(1)}
                      className={cn(
                        'w-8 h-8 rounded-lg border text-xs font-bold transition-all',
                        isActive
                          ? cfg.active
                          : 'border-zinc-700 text-zinc-600 hover:border-zinc-500 hover:text-zinc-400 bg-transparent',
                        readOnly && 'cursor-default',
                      )}
                    >
                      {cfg.label}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        );
      })}

      {students.length === 0 && (
        <div className="text-center py-12 text-zinc-600 text-sm">
          No active students in this class.
        </div>
      )}
    </div>
  );
}
