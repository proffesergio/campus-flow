'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Student } from '@/lib/hooks/useStudents';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { getInitials } from '@/lib/utils';

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'info' | 'warning'> = {
  active: 'success',
  inactive: 'danger',
  graduated: 'info',
  transferred: 'warning',
};

interface Props {
  students: Student[];
  loading: boolean;
  onEdit: (student: Student) => void;
  onDeleted: () => void;
}

export default function StudentTable({ students, loading, onEdit, onDeleted }: Props) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/students/${deleteTarget.id}`);
      toast.success('Student deactivated');
      onDeleted();
    } catch {
      toast.error('Failed to deactivate student');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!students.length) {
    return (
      <div className="text-center py-16 text-zinc-500">
        <p className="text-lg font-medium text-zinc-400">No students found</p>
        <p className="text-sm mt-1">Add your first student to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-left">
              <th className="pb-3 pl-4 font-medium w-12">#</th>
              <th className="pb-3 font-medium">Student</th>
              <th className="pb-3 font-medium">Class</th>
              <th className="pb-3 font-medium">Roll</th>
              <th className="pb-3 font-medium">Guardian Phone</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <tr
                key={student.id}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group"
              >
                <td className="py-3 pl-4 text-zinc-500">{idx + 1}</td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {student.photoUrl && <AvatarImage src={student.photoUrl} />}
                      <AvatarFallback className="text-xs">
                        {getInitials(student.firstName, student.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-zinc-100">
                      {student.firstName} {student.lastName}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-zinc-300">
                  {student.class.name}
                  {student.class.section ? ` (${student.class.section})` : ''}
                </td>
                <td className="py-3 text-zinc-400">{student.rollNumber ?? '—'}</td>
                <td className="py-3 text-zinc-400">{student.guardianPhone}</td>
                <td className="py-3">
                  <Badge variant={STATUS_VARIANT[student.status] ?? 'secondary'}>
                    {student.status}
                  </Badge>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => router.push(`/dashboard/students/${student.id}`)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEdit(student)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                      onClick={() => setDeleteTarget(student)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Student</DialogTitle>
            <DialogDescription>
              This will deactivate{' '}
              <span className="font-medium text-white">
                {deleteTarget?.firstName} {deleteTarget?.lastName}
              </span>
              . Their records are preserved. You can reactivate them later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
