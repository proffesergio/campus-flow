'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useClasses } from '@/lib/hooks/useClasses';
import type { Student } from '@/lib/hooks/useStudents';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  classId: z.string().min(1, 'Required'),
  rollNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  guardianName: z.string().min(1, 'Required'),
  guardianPhone: z.string().min(1, 'Required'),
  guardianEmail: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  createPortalAccess: z.boolean().optional(),
  portalEmail: z.string().email().optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student?: Student | null;
}

export default function StudentDrawer({ open, onClose, onSuccess, student }: Props) {
  const { classes } = useClasses();
  const isEdit = !!student;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset(
        student
          ? {
              firstName: student.firstName,
              lastName: student.lastName,
              classId: student.class.id,
              rollNumber: student.rollNumber ?? '',
              guardianPhone: student.guardianPhone,
            }
          : {},
      );
    }
  }, [open, student, reset]);

  const createPortalAccess = watch('createPortalAccess');

  async function onSubmit(data: FormData) {
    try {
      if (isEdit) {
        await api.put(`/students/${student!.id}`, data);
        toast.success('Student updated');
      } else {
        await api.post('/students', data);
        toast.success('Student added');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Something went wrong');
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Student' : 'Add Student'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Update student details.' : 'Fill in the details to enrol a new student.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-6 py-4 flex-1">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First Name *</Label>
              <Input {...register('firstName')} placeholder="Ahmed" />
              {errors.firstName && <p className="text-xs text-red-400">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Last Name *</Label>
              <Input {...register('lastName')} placeholder="Rahman" />
              {errors.lastName && <p className="text-xs text-red-400">{errors.lastName.message}</p>}
            </div>
          </div>

          {/* Class + Roll */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Class *</Label>
              <Select onValueChange={(v) => setValue('classId', v)} defaultValue={student?.class.id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.section ? ` (${c.section})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.classId && <p className="text-xs text-red-400">{errors.classId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Roll Number</Label>
              <Input {...register('rollNumber')} placeholder="01" />
            </div>
          </div>

          {/* DOB + Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date of Birth</Label>
              <Input {...register('dateOfBirth')} type="date" />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select onValueChange={(v) => setValue('gender', v as 'male' | 'female' | 'other')}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Guardian */}
          <div className="space-y-1.5">
            <Label>Guardian Name *</Label>
            <Input {...register('guardianName')} placeholder="Parent / guardian full name" />
            {errors.guardianName && <p className="text-xs text-red-400">{errors.guardianName.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Guardian Phone *</Label>
              <Input {...register('guardianPhone')} placeholder="+880..." />
              {errors.guardianPhone && <p className="text-xs text-red-400">{errors.guardianPhone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Guardian Email</Label>
              <Input {...register('guardianEmail')} type="email" placeholder="parent@email.com" />
            </div>
          </div>

          {/* Address + Blood Group */}
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input {...register('address')} placeholder="House, Road, Area, City" />
          </div>
          <div className="space-y-1.5">
            <Label>Blood Group</Label>
            <Input {...register('bloodGroup')} placeholder="A+, B-, O+" className="w-32" />
          </div>

          {/* Portal access — only on create */}
          {!isEdit && (
            <div className="border border-zinc-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="portal"
                  className="rounded border-zinc-600"
                  {...register('createPortalAccess')}
                />
                <Label htmlFor="portal" className="cursor-pointer">Create student portal account</Label>
              </div>
              {createPortalAccess && (
                <div className="space-y-1.5">
                  <Label>Portal Email</Label>
                  <Input {...register('portalEmail')} type="email" placeholder="student@email.com" />
                  <p className="text-xs text-zinc-500">Student will use this to log in</p>
                </div>
              )}
            </div>
          )}
        </form>

        <SheetFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Student'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
