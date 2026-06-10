'use client';

import { Suspense, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, GraduationCap, Users, ClipboardCheck,
  DollarSign, Sparkles, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { setRoleCookie } from '@/lib/session';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

// ── Separated component so useSearchParams is inside Suspense ──────────────
function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);
  const [featureIdx, setFeatureIdx] = useState(0);

  const features = [
    t('feature1'),
    t('feature2'),
    t('feature3'),
    t('feature4'),
    t('feature5'),
  ];

  const floatingCards = [
    { icon: Users,         value: '2,847',  label: t('studentsEnrolled'),  colorBg: 'bg-blue-500/10',   colorBorder: 'border-blue-500/20',   colorText: 'text-blue-400',    delay: 0    },
    { icon: ClipboardCheck,value: '98.4%',  label: t('attendanceTracked'), colorBg: 'bg-emerald-500/10',colorBorder: 'border-emerald-500/20',colorText: 'text-emerald-400', delay: 0.12 },
    { icon: DollarSign,    value: '৳12.4M', label: t('feesCollected'),     colorBg: 'bg-purple-500/10', colorBorder: 'border-purple-500/20', colorText: 'text-purple-400',  delay: 0.24 },
    { icon: Sparkles,      value: 'AI',     label: t('poweredReports'),    colorBg: 'bg-orange-500/10', colorBorder: 'border-orange-500/20', colorText: 'text-orange-400',  delay: 0.36 },
  ];

  useEffect(() => {
    const timer = setInterval(() => setFeatureIdx((i) => (i + 1) % features.length), 2600);
    return () => clearInterval(timer);
  }, [features.length]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginForm) {
    try {
      const res = await api.post<{
        success: boolean;
        data: { user: { role: string }; schoolSlug: string; schoolName: string };
      }>('/auth/login', data);
      localStorage.setItem('campusflow_slug', res.data.data.schoolSlug);
      const { role } = res.data.data.user;
      setRoleCookie(role);
      const redirect = searchParams.get('redirect');
      if (redirect) { router.push(redirect); return; }
      switch (role) {
        case 'student': router.push('/student'); break;
        case 'parent':  router.push('/parent');  break;
        case 'finance': router.push('/dashboard/finance'); break;
        default:        router.push('/dashboard');
      }
    } catch {
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 600);
      toast.error(t('invalidCredentials'));
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#09090b' }}>

      {/* ── Left panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-12">

        {/* Gradient orbs */}
        <motion.div className="absolute top-[10%] left-[5%] w-96 h-96 rounded-full bg-blue-600 opacity-[0.12] blur-3xl"
          animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 7, repeat: Infinity }} />
        <motion.div className="absolute bottom-[20%] right-[10%] w-80 h-80 rounded-full bg-purple-600 opacity-[0.10] blur-3xl"
          animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 9, repeat: Infinity, delay: 2 }} />
        <motion.div className="absolute top-[50%] left-[40%] w-64 h-64 rounded-full bg-indigo-500 opacity-[0.08] blur-3xl"
          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 11, repeat: Infinity, delay: 1 }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}>
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">CampusFlow</span>
        </motion.div>

        {/* Hero copy */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
          className="relative z-10 space-y-7">
          <div>
            <h1 className="text-[2.6rem] font-bold leading-tight text-white">
              {t('heroHeading')}<br />
              <span style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t('heroBangladesh')}
              </span>
            </h1>
            <div className="h-7 mt-4 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p key={featureIdx}
                  initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -18, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2 text-sm" style={{ color: '#71717a' }}>
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#60a5fa' }} />
                  {features[featureIdx]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {floatingCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.45, delay: 0.45 + card.delay }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  className={`relative rounded-xl border p-4 backdrop-blur-sm ${card.colorBg} ${card.colorBorder}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <Icon className={`w-4 h-4 ${card.colorText}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{card.value}</p>
                      <p className="text-xs leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{card.label}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <p className="text-xs" style={{ color: '#3f3f46' }}>
            {t('trustedBy')}
          </p>
        </motion.div>
      </div>

      {/* ── Right panel: form ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">

        {/* Mobile logo */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex lg:hidden items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">CampusFlow</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-sm">

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">{t('welcomeBack')}</h2>
            <p className="text-sm mt-1.5" style={{ color: '#71717a' }}>
              {t('signInSubtitle')}
            </p>
          </div>

          <motion.form onSubmit={handleSubmit(onSubmit)}
            animate={shakeForm ? { x: [-6, 6, -5, 5, -3, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4">

            {/* Email */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }} className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#d4d4d8' }}>
                {t('email')}
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                style={{
                  display: 'flex', width: '100%', height: '44px',
                  background: '#18181b', border: '1px solid #27272a',
                  borderRadius: '10px', padding: '0 16px',
                  color: 'white', fontSize: '14px', outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#27272a'}
              />
              <AnimatePresence>
                {errors.email && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} className="text-xs" style={{ color: '#f87171' }}>
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Password */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.28 }} className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#d4d4d8' }}>
                {t('password')}
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  style={{
                    display: 'flex', width: '100%', height: '44px',
                    background: '#18181b', border: '1px solid #27272a',
                    borderRadius: '10px', padding: '0 44px 0 16px',
                    color: 'white', fontSize: '14px', outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#27272a'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', display: 'flex' }}>
                  {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} className="text-xs" style={{ color: '#f87171' }}>
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Submit */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36 }} style={{ paddingTop: 4 }}>
              <motion.button type="submit" disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                style={{
                  width: '100%', height: '44px', borderRadius: '10px',
                  background: isSubmitting ? '#1e40af' : 'linear-gradient(135deg,#3b82f6,#2563eb)',
                  color: 'white', fontWeight: 600, fontSize: '14px',
                  border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
                  opacity: isSubmitting ? 0.7 : 1,
                  transition: 'opacity 0.15s',
                }}>
                {isSubmitting ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'block' }} />
                    {t('signingIn')}
                  </>
                ) : (
                  <>{t('signInButton')} <ArrowRight style={{ width: 16, height: 16 }} /></>
                )}
              </motion.button>
            </motion.div>
          </motion.form>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
            className="text-sm text-center mt-6" style={{ color: '#52525b' }}>
            {t('newSchool')}{' '}
            <Link href="/register" style={{ color: '#60a5fa', textDecoration: 'none' }}>
              {t('registerHere')}
            </Link>
          </motion.p>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          style={{ position: 'absolute', bottom: 24, fontSize: 11, color: '#27272a' }}>
          © {new Date().getFullYear()} CampusFlow
        </motion.p>
      </div>
    </div>
  );
}

// ── Default export wraps in Suspense (required for useSearchParams in Next 15) ──
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #27272a', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
