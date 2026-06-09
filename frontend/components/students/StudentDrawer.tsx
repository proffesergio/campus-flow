'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useClasses } from '@/lib/hooks/useClasses';
import type { Student } from '@/lib/hooks/useStudents';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Combobox } from '@/components/ui/combobox';
import { AvatarField } from '@/components/ui/avatar-field';
import { Wizard, WizardStep } from '@/components/ui/wizard';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  classId: z.string().min(1, 'Required'),
  rollNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional().or(z.literal('')),
  bloodGroup: z.string().optional(),
  photoUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  guardianName: z.string().min(1, 'Required'),
  guardianPhone: z.string().min(1, 'Required'),
  guardianEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  createPortalAccess: z.boolean().optional(),
  portalEmail: z.string().email('Invalid email').optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student?: Student | null;
}

const STEP_FIELDS: Record<string, (keyof FormData)[]> = {
  personal: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'bloodGroup', 'photoUrl'],
  academic: ['classId', 'rollNumber'],
  guardian: ['guardianName', 'guardianPhone', 'guardianEmail', 'address'],
  review: [],
};

export default function StudentDrawer({ open, onClose, onSuccess, student }: Props) {
  const { classes } = useClasses();
  const isEdit = !!student;
  const [submitting, setSubmitting] = useState(false);

  const {
    register, handleSubmit, reset, watch, setValue, trigger,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onTouched' });

  useEffect(() => {
    if (open) {
      reset(
        student
          ? {
              firstName: student.firstName,
              lastName: student.lastName,
              classId: student.class.id,
              rollNumber: student.rollNumber ?? '',
              guardianName: student.guardianName ?? '',
              guardianPhone: student.guardianPhone,
              photoUrl: student.photoUrl ?? '',
            }
          : {},
      );
    }
  }, [open, student, reset]);

  const values = watch();
  const classOptions = classes.map((c) => ({ value: c.id, label: `${c.name}${c.section ? ` – ${c.section}` : ''}` }));
  const initials = `${(values.firstName?.[0] ?? '')}${(values.lastName?.[0] ?? '')}`.toUpperCase();

  function validateStep(id: string) {
    const fields = STEP_FIELDS[id];
    return fields.length === 0 ? true : trigger(fields);
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    // Strip empty optionals; convert date-only DOB to an ISO datetime the API expects.
    const payload: Record<string, unknown> = {
      firstName: data.firstName,
      lastName: data.lastName,
      classId: data.classId,
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
    };
    if (data.rollNumber) payload.rollNumber = data.rollNumber;
    if (data.gender) payload.gender = data.gender;
    if (data.bloodGroup) payload.bloodGroup = data.bloodGroup;
    if (data.photoUrl) payload.photoUrl = data.photoUrl;
    if (data.guardianEmail) payload.guardianEmail = data.guardianEmail;
    if (data.address) payload.address = data.address;
    if (data.dateOfBirth) payload.dateOfBirth = new Date(data.dateOfBirth).toISOString();
    if (!isEdit && data.createPortalAccess) {
      payload.createPortalAccess = true;
      if (data.portalEmail) payload.portalEmail = data.portalEmail;
    }
    try {
      if (isEdit) {
        await api.put(`/students/${student!.id}`, payload);
        toast.success('Student updated');
      } else {
        await api.post('/students', payload);
        toast.success('Student added');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = 'bg-zinc-800 border-zinc-700 text-white';

  const steps: WizardStep[] = [
    {
      id: 'personal', title: 'Personal',
      content: (
        <div className="space-y-4">
          <AvatarField value={values.photoUrl} onChange={(v) => setValue('photoUrl', v, { shouldValidate: true })} initials={initials} />
          {errors.photoUrl && <p className="text-xs text-red-400 -mt-2">{errors.photoUrl.message}</p>}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="First Name" required error={errors.firstName?.message}><Input {...register('firstName')} className={inputCls} placeholder="Ahmed" /></FormField>
            <FormField label="Last Name" required error={errors.lastName?.message}><Input {...register('lastName')} className={inputCls} placeholder="Rahman" /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date of Birth" error={errors.dateOfBirth?.message}><Input type="date" {...register('dateOfBirth')} className={inputCls} /></FormField>
            <FormField label="Gender" error={errors.gender?.message}>
              <select {...register('gender')} className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white">
                <option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
            </FormField>
          </div>
          <FormField label="Blood Group" error={errors.bloodGroup?.message}><Input {...register('bloodGroup')} className={`${inputCls} w-32`} placeholder="A+, O-" /></FormField>
        </div>
      ),
    },
    {
      id: 'academic', title: 'Academic',
      content: (
        <div className="space-y-4">
          <FormField label="Class" required error={errors.classId?.message}>
            <Combobox options={classOptions} value={values.classId} onChange={(v) => setValue('classId', v, { shouldValidate: true })} placeholder="Select class" />
          </FormField>
          <FormField label="Roll Number" error={errors.rollNumber?.message}><Input {...register('rollNumber')} className={inputCls} placeholder="01" /></FormField>
        </div>
      ),
    },
    {
      id: 'guardian', title: 'Guardian',
      content: (
        <div className="space-y-4">
          <FormField label="Guardian Name" required error={errors.guardianName?.message}><Input {...register('guardianName')} className={inputCls} placeholder="Parent / guardian full name" /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Guardian Phone" required error={errors.guardianPhone?.message}><Input {...register('guardianPhone')} className={inputCls} placeholder="+880…" /></FormField>
            <FormField label="Guardian Email" error={errors.guardianEmail?.message}><Input {...register('guardianEmail')} type="email" className={inputCls} placeholder="parent@email.com" /></FormField>
          </div>
          <FormField label="Address" error={errors.address?.message}><Input {...register('address')} className={inputCls} placeholder="House, Road, Area, City" /></FormField>
        </div>
      ),
    },
    {
      id: 'review', title: 'Review',
      content: (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 text-sm space-y-1.5">
            <p className="text-white font-medium">{values.firstName} {values.lastName}</p>
            <p className="text-zinc-400">Class: {classOptions.find((c) => c.value === values.classId)?.label ?? '—'}{values.rollNumber ? ` · Roll ${values.rollNumber}` : ''}</p>
            <p className="text-zinc-400">Guardian: {values.guardianName || '—'} · {values.guardianPhone || '—'}</p>
          </div>
          {!isEdit && (
            <div className="border border-zinc-800 rounded-lg p-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('createPortalAccess')} className="rounded border-zinc-600" />
                <span className="text-sm text-zinc-300">Create student portal account</span>
              </label>
              {values.createPortalAccess && (
                <FormField label="Portal Email" error={errors.portalEmail?.message}>
                  <Input {...register('portalEmail')} type="email" className={inputCls} placeholder="student@email.com" />
                </FormField>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Student' : 'Add Student'}</SheetTitle>
          <SheetDescription>{isEdit ? 'Update student details.' : 'Fill in the details to enrol a new student.'}</SheetDescription>
        </SheetHeader>
        <div className="px-6 py-4">
          <Wizard
            steps={steps}
            onValidateStep={validateStep}
            onSubmit={handleSubmit(onSubmit)}
            submitting={submitting}
            submitLabel={isEdit ? 'Save Changes' : 'Add Student'}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
