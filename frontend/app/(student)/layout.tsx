'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  DollarSign,
  CalendarDays,
  BookMarked,
  Bot,
  BarChart3,
  GraduationCap,
  Menu,
  LogOut,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { clearRoleCookie } from '@/lib/session';
import { toast } from 'sonner';

const navItems = [
  { href: '/student', label: 'Home', icon: LayoutDashboard, exact: true },
  { href: '/student/grades', label: 'My Grades', icon: BookOpen },
  { href: '/student/attendance', label: 'Attendance', icon: ClipboardCheck },
  { href: '/student/fees', label: 'Fees', icon: DollarSign },
  { href: '/student/exams', label: 'Exam Schedule', icon: CalendarDays },
  { href: '/student/practice', label: 'Practice', icon: BookMarked },
  { href: '/student/performance', label: 'Performance', icon: BarChart3 },
  { href: '/student/ai-assistant', label: 'AI Assistant', icon: Bot },
];

interface Me {
  firstName: string;
  lastName: string;
  rollNumber: string;
  class?: { name: string; section?: string };
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get<{ success: boolean; data: Me }>('/students/me')
      .then((r) => setMe(r.data.data))
      .catch(() => null);
    api.get<{ success: boolean; data: { unread: number } }>('/notifications/inbox')
      .then((r) => setUnread(r.data.data.unread ?? 0))
      .catch(() => null);
  }, []);

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
      clearRoleCookie();
      router.push('/login');
    } catch {
      toast.error('Failed to logout');
    }
  }

  const initials = me
    ? `${me.firstName[0] ?? ''}${me.lastName[0] ?? ''}`.toUpperCase()
    : 'S';

  const Nav = ({ mobile = false }) => (
    <div className={cn('flex flex-col h-full bg-zinc-900 border-r border-zinc-800', mobile ? 'w-64' : 'w-64')}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-none">CampusFlow</p>
          <p className="text-xs text-indigo-400 mt-0.5">Student Portal</p>
        </div>
      </div>

      {/* Student info */}
      {me && (
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{me.firstName} {me.lastName}</p>
              <p className="text-xs text-zinc-400 truncate">
                {me.class?.name}{me.class?.section ? ` ${me.class.section}` : ''} · Roll {me.rollNumber}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
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
                  ? 'bg-indigo-600/15 text-indigo-400 border-l-2 border-indigo-500 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border-l-2 border-transparent',
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-zinc-800 p-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Nav />
      </div>

      {/* Mobile Sidebar */}
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

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 gap-4 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-zinc-400 hover:text-zinc-200"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="relative">
            <Bell className="w-5 h-5 text-zinc-400" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
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
