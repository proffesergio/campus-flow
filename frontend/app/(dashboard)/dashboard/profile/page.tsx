'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Shield, KeyRound, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface Me {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string | null;
  photoUrl: string | null;
}

const card = 'bg-zinc-900 border border-zinc-800 rounded-xl p-6';
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tn = useTranslations('nav');

  const ROLE_LABEL: Record<string, string> = {
    super_admin: tn('roles.super_admin'),
    school_admin: tn('roles.school_admin'),
    teacher: tn('roles.teacher'),
    finance: tn('roles.finance'),
    student: 'Student',
    parent: 'Parent',
  };

  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    api.get<{ success: boolean; data: { user: Me } }>('/auth/me')
      .then((r) => {
        const u = r.data.data.user;
        setMe(u);
        setFirstName(u.firstName);
        setLastName(u.lastName);
        setPhone(u.phone ?? '');
      })
      .catch(() => toast.error(t('failedLoad')))
      .finally(() => setLoading(false));
  }, [t]);

  async function saveProfile() {
    if (!firstName.trim() || !lastName.trim()) { toast.error(t('nameRequired')); return; }
    setSavingProfile(true);
    try {
      const r = await api.put<{ success: boolean; data: Me }>('/auth/me', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
      });
      setMe(r.data.data);
      toast.success(t('profileUpdated'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('failedUpdate'));
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword() {
    if (newPassword.length < 8) { toast.error(t('passwordTooShort')); return; }
    if (newPassword !== confirmPassword) { toast.error(t('passwordMismatch')); return; }
    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success(t('passwordChanged'));
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('failedChangePassword'));
    } finally {
      setSavingPassword(false);
    }
  }

  const initials = me ? `${me.firstName[0] ?? ''}${me.lastName[0] ?? ''}`.toUpperCase() : '';

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{t('subtitle')}</p>
      </div>

      {loading ? (
        <>
          <Skeleton className="h-40 bg-zinc-900 rounded-xl" />
          <Skeleton className="h-56 bg-zinc-900 rounded-xl" />
        </>
      ) : !me ? (
        <div className={card}><p className="text-zinc-500">{t('couldNotLoad')}</p></div>
      ) : (
        <>
          {/* Identity header */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className={`${card} flex items-center gap-4`}>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-white">{me.firstName} {me.lastName}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500 flex-wrap">
                <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {me.email}</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs">
                  <Shield className="w-3 h-3" /> {ROLE_LABEL[me.role] ?? me.role}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Edit profile */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }} className={card}>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-blue-400" />
              <h2 className="font-semibold text-white">{t('personalInfo')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('firstName')}</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('lastName')}</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('phone')}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('phonePlaceholder')} className="pl-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t('email')}</Label>
                <Input value={me.email} disabled className="opacity-60 cursor-not-allowed" />
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <Button onClick={saveProfile} disabled={savingProfile} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingProfile ? t('saving') : t('saveChanges')}
              </Button>
            </div>
          </motion.div>

          {/* Change password */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className={card}>
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-purple-400" />
              <h2 className="font-semibold text-white">{t('changePassword')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2 sm:max-w-xs">
                <Label>{t('currentPassword')}</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('newPassword')}</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('newPasswordPlaceholder')} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('confirmNewPassword')}</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-zinc-600 mt-3">{t('passwordHint')}</p>
            <div className="flex justify-end mt-4">
              <Button
                onClick={savePassword}
                disabled={savingPassword || !currentPassword || !newPassword}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
              >
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                {savingPassword ? t('updatingPassword') : t('updatePassword')}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
