'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

const schema = z.object({
  schoolName: z.string().min(2, 'School name is required'),
  adminFirstName: z.string().min(1, 'Required'),
  adminLastName: z.string().min(1, 'Required'),
  adminEmail: z.string().email('Valid email required'),
  adminPassword: z
    .string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Need one uppercase letter')
    .regex(/[0-9]/, 'Need one number'),
  adminPhone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const inputStyle = {
  display: 'flex', width: '100%', height: '44px',
  background: '#18181b', border: '1px solid #27272a',
  borderRadius: '10px', padding: '0 16px',
  color: 'white', fontSize: '14px', outline: 'none',
  transition: 'border-color 0.15s',
} as React.CSSProperties;

function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" style={{ color: '#d4d4d8' }}>{label}</label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="text-xs" style={{ color: '#f87171' }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [shakeForm, setShakeForm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const schoolName = watch('schoolName', '');
  const generatedSlug = toSlug(schoolName);

  async function onSubmit(data: FormData) {
    const schoolSlug = toSlug(data.schoolName);
    if (!schoolSlug) {
      toast.error('Could not generate a valid school ID from the name');
      return;
    }
    try {
      await axios.post(
        `${API_URL}/api/auth/register-school`,
        {
          schoolName: data.schoolName,
          schoolSlug,
          adminFirstName: data.adminFirstName,
          adminLastName: data.adminLastName,
          adminEmail: data.adminEmail,
          adminPassword: data.adminPassword,
          adminPhone: data.adminPhone || undefined,
        },
        { withCredentials: true },
      );
      localStorage.setItem('campusflow_slug', schoolSlug);
      toast.success('School registered! Please log in.');
      router.push('/login');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 600);
      toast.error(msg ?? 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#09090b' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">CampusFlow</h1>
            <p className="text-xs" style={{ color: '#71717a' }}>Register your school</p>
          </div>
        </div>

        <div style={{
          background: '#18181b', border: '1px solid #27272a',
          borderRadius: '16px', padding: '32px',
        }}>
          <h2 className="text-lg font-semibold text-white mb-6">Create your school account</h2>

          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            animate={shakeForm ? { x: [-6, 6, -5, 5, -3, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* School name */}
            <Field label="School Name *" error={errors.schoolName?.message}>
              <input
                {...register('schoolName')}
                placeholder="e.g. Dhaka Grammar School"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#27272a'}
              />
              {generatedSlug && (
                <p className="text-xs mt-1" style={{ color: '#52525b' }}>
                  Your school URL:{' '}
                  <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>
                    {generatedSlug}.campusflow.app
                  </span>
                </p>
              )}
            </Field>

            {/* Admin name */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name *" error={errors.adminFirstName?.message}>
                <input {...register('adminFirstName')} placeholder="Ahmed" style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#27272a'} />
              </Field>
              <Field label="Last Name *" error={errors.adminLastName?.message}>
                <input {...register('adminLastName')} placeholder="Rahman" style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#27272a'} />
              </Field>
            </div>

            {/* Admin email */}
            <Field label="Admin Email *" error={errors.adminEmail?.message}>
              <input {...register('adminEmail')} type="email" placeholder="admin@school.edu.bd"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#27272a'} />
            </Field>

            {/* Admin password */}
            <Field label="Password *" error={errors.adminPassword?.message}>
              <input {...register('adminPassword')} type="password"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#27272a'} />
            </Field>

            {/* Phone */}
            <Field label="Phone (optional)">
              <input {...register('adminPhone')} type="tel" placeholder="+8801700000000"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#27272a'} />
            </Field>

            <div className="pt-2 space-y-3">
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                style={{
                  width: '100%', height: '44px', borderRadius: '10px',
                  background: isSubmitting ? '#1e40af' : 'linear-gradient(135deg,#3b82f6,#2563eb)',
                  color: 'white', fontWeight: 600, fontSize: '14px',
                  border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: isSubmitting ? 0.7 : 1,
                  boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
                }}
              >
                {isSubmitting
                  ? 'Registering...'
                  : (<>Get Started <ArrowRight style={{ width: 16, height: 16 }} /></>)
                }
              </motion.button>

              <Link href="/login" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontSize: '13px', color: '#71717a', textDecoration: 'none',
              }}>
                <ArrowLeft style={{ width: 14, height: 14 }} />
                Already have an account? Sign in
              </Link>
            </div>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
