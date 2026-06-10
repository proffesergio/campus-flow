'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Palette, Upload, Trash2, Save, Loader2, GraduationCap, ChevronLeft,
  LayoutDashboard, Users, Bell, ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';

interface SchoolSettings {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
}

const HEX_RE = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;
const MAX_LOGO_BYTES = 1_000_000; // ~1MB

const DEFAULTS: SchoolSettings = {
  name: '',
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  logoUrl: null,
};

function ColorField({
  label, value, onChange, invalidMsg,
}: { label: string; value: string; onChange: (v: string) => void; invalidMsg: string }) {
  const valid = HEX_RE.test(value);
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-zinc-700 flex-shrink-0">
          <input
            type="color"
            value={valid ? value : '#000000'}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] cursor-pointer border-0 bg-transparent p-0"
            aria-label={`${label} picker`}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          maxLength={7}
          className={`flex-1 h-11 rounded-lg bg-zinc-900 border px-3 text-sm text-white font-mono outline-none transition-colors ${
            valid ? 'border-zinc-700 focus:border-blue-500' : 'border-red-500/60'
          }`}
          placeholder="#3B82F6"
        />
      </div>
      {!valid && <p className="text-xs text-red-400">{invalidMsg}</p>}
    </div>
  );
}

export default function AppearanceSettingsPage() {
  const t = useTranslations('settings');

  const [form, setForm] = useState<SchoolSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get<{ success: boolean; data: SchoolSettings }>('/schools/me')
      .then((res) => {
        const d = res.data.data;
        setForm({
          name: d.name ?? '',
          primaryColor: (d.primaryColor ?? DEFAULTS.primaryColor).toUpperCase(),
          secondaryColor: (d.secondaryColor ?? DEFAULTS.secondaryColor).toUpperCase(),
          logoUrl: d.logoUrl ?? null,
        });
      })
      .catch(() => toast.error(t('failedLoad')))
      .finally(() => setLoading(false));
  }, [t]);

  const set = useCallback(<K extends keyof SchoolSettings>(key: K, value: SchoolSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  function onLogoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('logoNotImage'));
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error(t('logoTooLarge'));
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set('logoUrl', reader.result as string);
    reader.onerror = () => toast.error(t('logoReadError'));
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!HEX_RE.test(form.primaryColor) || !HEX_RE.test(form.secondaryColor)) {
      toast.error(t('invalidColors'));
      return;
    }
    setSaving(true);
    try {
      await api.put('/schools/me', {
        name: form.name.trim() || undefined,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        logoUrl: form.logoUrl,
      });
      toast.success(t('appearanceUpdated'));
    } catch {
      toast.error(t('failedSave'));
    } finally {
      setSaving(false);
    }
  }

  const { primaryColor, secondaryColor, logoUrl, name } = form;

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: 'linear-gradient(180deg, #09090b 0%, #0a0a0f 100%)' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-3">
          <ChevronLeft className="w-3.5 h-3.5" /> {t('backToSettings')}
        </Link>
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">{t('appearanceTitle')}</h1>
        </div>
        <p className="text-zinc-400 text-sm mt-1">{t('appearanceSubtitle')}</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-zinc-900/60 border border-zinc-800 rounded-xl animate-pulse" />
          <div className="h-96 bg-zinc-900/60 border border-zinc-800 rounded-xl animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Editor ─────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-6">

            {/* School name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">{t('schoolName')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => set('name', e.target.value)}
                maxLength={120}
                className="w-full h-11 rounded-lg bg-zinc-900 border border-zinc-700 px-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                placeholder="Dhaka Grammar School"
              />
            </div>

            <ColorField label={t('primaryColor')} value={primaryColor} onChange={(v) => set('primaryColor', v)} invalidMsg={t('invalidHex')} />
            <ColorField label={t('secondaryColor')} value={secondaryColor} onChange={(v) => set('secondaryColor', v)} invalidMsg={t('invalidHex')} />

            {/* Logo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">{t('logo')}</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-zinc-700 bg-zinc-800/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="School logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-zinc-600" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm text-zinc-200 transition-colors"
                  >
                    <Upload className="w-4 h-4" /> {t('uploadImage')}
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => { set('logoUrl', null); if (fileRef.current) fileRef.current.value = ''; }}
                      className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm text-red-400 hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> {t('remove')}
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onLogoSelected} className="hidden" />
              </div>
              <p className="text-xs text-zinc-600">{t('logoHint')}</p>
            </div>

            {/* Save */}
            <div className="pt-2 border-t border-zinc-800">
              <motion.button
                type="button"
                onClick={handleSave}
                disabled={saving}
                whileTap={{ scale: saving ? 1 : 0.98 }}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? t('saving') : t('saveChanges')}
              </motion.button>
            </div>
          </motion.div>

          {/* ── Live preview ───────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-semibold text-white">{t('livePreview')}</h3>
            </div>

            <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950">
              {/* Mock top bar */}
              <div className="h-12 flex items-center gap-2 px-4" style={{ background: secondaryColor }}>
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <GraduationCap className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-sm font-bold text-white truncate">{name || t('yourSchool')}</span>
              </div>

              <div className="flex">
                {/* Mock sidebar */}
                <div className="w-32 bg-zinc-900 border-r border-zinc-800 p-2 space-y-1">
                  {[
                    { icon: LayoutDashboard, label: t('mockDashboard'), active: true },
                    { icon: Users,           label: t('mockStudents'),  active: false },
                    { icon: Bell,            label: t('mockAlerts'),    active: false },
                  ].map(({ icon: Icon, label, active }) => (
                    <div key={label}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px]"
                      style={active
                        ? { background: `${primaryColor}26`, color: primaryColor, borderLeft: `2px solid ${primaryColor}` }
                        : { color: '#a1a1aa' }}>
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </div>
                  ))}
                </div>

                {/* Mock content */}
                <div className="flex-1 p-4 space-y-3">
                  <div className="h-3 w-24 rounded bg-zinc-800" />
                  <div className="rounded-lg border border-zinc-800 p-3 space-y-2">
                    <div className="h-2.5 w-20 rounded" style={{ background: primaryColor, opacity: 0.7 }} />
                    <div className="h-2 w-32 rounded bg-zinc-800" />
                    <div className="h-2 w-28 rounded bg-zinc-800" />
                  </div>
                  <div className="flex gap-2">
                    <button className="h-7 px-3 rounded-md text-[11px] font-semibold text-white" style={{ background: primaryColor }}>
                      {t('primary')}
                    </button>
                    <button className="h-7 px-3 rounded-md text-[11px] font-semibold text-white" style={{ background: secondaryColor }}>
                      {t('secondary')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Swatches */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { label: t('primary'),   val: primaryColor },
                { label: t('secondary'), val: secondaryColor },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-800/40 border border-zinc-800">
                  <div className="w-8 h-8 rounded-md border border-zinc-700" style={{ background: val }} />
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-400">{label}</p>
                    <p className="text-xs font-mono text-zinc-200 truncate">{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
