'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Bell, GraduationCap, Menu, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { clearRoleCookie } from '@/lib/session';
import { toast } from 'sonner';
import LanguageToggle from '@/components/LanguageToggle';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('parent');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const navItems = [
    { href: '/parent', label: t('myChildren'), icon: Users, exact: true },
    { href: '/parent/notices', label: t('notices'), icon: Bell },
  ];

  useEffect(() => {
    api
      .get<{ success: boolean; data: { unread: number } }>('/parents/me/notices')
      .then((r) => setUnread(r.data.data.unread ?? 0))
      .catch(() => null);
  }, []);

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
      clearRoleCookie();
      router.push('/login');
    } catch {
      toast.error(t('failedLogout'));
    }
  }

  const Nav = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn('flex flex-col h-full bg-zinc-900 border-r border-zinc-800 w-64', mobile && 'w-64')}>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-none">CampusFlow</p>
          <p className="text-xs text-emerald-400 mt-0.5">{t('portal')}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5',
                active
                  ? 'bg-emerald-600/15 text-emerald-400 border-l-2 border-emerald-500 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border-l-2 border-transparent',
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {item.href === '/parent/notices' && unread > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <div className="hidden md:flex flex-shrink-0">
        <Nav />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed left-0 top-0 bottom-0 z-50 md:hidden"
            >
              <Nav mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 gap-4 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="md:hidden text-zinc-400 hover:text-zinc-200">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <LanguageToggle />
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
            P
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
