'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Palette, ChevronRight, Building2, Users, Bell } from 'lucide-react';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const settings = [
  {
    label: 'Appearance',
    description: 'Brand colors, logo, and theme',
    href: '/dashboard/settings/appearance',
    icon: Palette,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    ready: true,
  },
  {
    label: 'School Profile',
    description: 'Name, address, and contact details',
    href: '/dashboard/settings/appearance',
    icon: Building2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    ready: true,
  },
  {
    label: 'Team & Roles',
    description: 'Manage staff accounts and permissions',
    href: '#',
    icon: Users,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    ready: false,
  },
  {
    label: 'Notifications',
    description: 'Email and in-app notification preferences',
    href: '#',
    icon: Bell,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    ready: false,
  },
];

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: 'linear-gradient(180deg, #09090b 0%, #0a0a0f 100%)' }}>
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 text-sm mt-1">Manage your school&apos;s configuration and preferences.</p>
      </motion.div>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
        {settings.map((s) => {
          const Icon = s.icon;
          const card = (
            <motion.div
              variants={fadeUp}
              whileHover={s.ready ? { y: -2, scale: 1.01 } : undefined}
              className={`relative flex items-start gap-4 p-5 rounded-xl bg-zinc-900 border ${s.border} h-full ${s.ready ? '' : 'opacity-60'}`}
            >
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-lg ${s.bg} flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">{s.label}</p>
                  {!s.ready && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-500">Soon</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-1">{s.description}</p>
              </div>
              {s.ready && <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-1" />}
            </motion.div>
          );

          return s.ready ? (
            <Link key={s.label} href={s.href} className="block">
              {card}
            </Link>
          ) : (
            <div key={s.label} className="cursor-not-allowed">{card}</div>
          );
        })}
      </motion.div>
    </div>
  );
}
