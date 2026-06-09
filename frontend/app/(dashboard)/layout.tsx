'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BookOpen,
  DollarSign,
  Bell,
  Bot,
  BookMarked,
  Layers,
  Library,
  Settings,
  Menu,
  X,
  GraduationCap,
  ChevronLeft,
  LogOut,
  Search,
  AlertTriangle,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { clearRoleCookie } from '@/lib/session';
import { toast } from 'sonner';
import CommandPalette from '@/components/CommandPalette';
import LanguageToggle from '@/components/LanguageToggle';
import QuickAddMenu from '@/components/dashboard/QuickAddMenu';
import { useTranslations } from 'next-intl';

const navGroups = [
  {
    groupKey: 'overview' as const,
    items: [
      { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
    ],
  },
  {
    groupKey: 'academics' as const,
    items: [
      { href: '/dashboard/students', key: 'students', icon: Users },
      { href: '/dashboard/classes', key: 'classes', icon: Layers },
      { href: '/dashboard/subjects', key: 'subjects', icon: Library },
      { href: '/dashboard/attendance', key: 'attendance', icon: ClipboardCheck },
      { href: '/dashboard/attendance/reports', key: 'attendanceReports', icon: ClipboardCheck },
      { href: '/dashboard/exams', key: 'exams', icon: BookOpen },
      { href: '/dashboard/at-risk', key: 'atRisk', icon: AlertTriangle },
    ],
  },
  {
    groupKey: 'finance' as const,
    items: [
      { href: '/dashboard/finance', key: 'finance', icon: DollarSign },
    ],
  },
  {
    groupKey: 'communication' as const,
    items: [
      { href: '/dashboard/notifications', key: 'notifications', icon: Bell },
    ],
  },
  {
    groupKey: 'aiTools' as const,
    items: [
      { href: '/dashboard/ai', key: 'aiAssistant', icon: Bot },
      { href: '/dashboard/practice', key: 'practice', icon: BookMarked },
    ],
  },
];

interface InboxData {
  unread: number;
  items: { id: string; title: string; body: string; isRead: boolean; createdAt: string; link?: string }[];
}

interface CurrentUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('nav');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inbox, setInbox] = useState<InboxData>({ unread: 0, items: [] });
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const fetchInbox = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: InboxData }>('/notifications/inbox');
      setInbox(res.data.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 30_000);
    return () => clearInterval(interval);
  }, [fetchInbox]);

  useEffect(() => {
    api.get<{ success: boolean; data: { user: CurrentUser } }>('/auth/me')
      .then((r) => setMe(r.data.data.user))
      .catch(() => { /* silent */ });
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function markAllRead() {
    try {
      await api.put('/notifications/read-all');
      setInbox((prev) => ({
        ...prev,
        unread: 0,
        items: prev.items.map((n) => ({ ...n, isRead: true })),
      }));
    } catch { /* silent */ }
  }

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
      clearRoleCookie();
      router.push('/login');
    } catch {
      toast.error('Failed to logout');
    }
  }

  const Sidebar = ({ mobile = false }) => (
    <div
      className={cn(
        'flex flex-col h-full bg-zinc-900 border-r border-zinc-800 transition-all duration-300',
        mobile ? 'w-64' : collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <span className="font-bold text-white text-lg">CampusFlow</span>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navGroups.map((group) => (
          <div key={group.groupKey} className="mb-4">
            {(!collapsed || mobile) && (
              <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider px-2 mb-1">
                {t(`groups.${group.groupKey}`)}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all mb-0.5',
                    active
                      ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border-l-2 border-transparent',
                    collapsed && !mobile && 'justify-center px-2',
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {(!collapsed || mobile) && <span>{t(item.key)}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: Settings + Logout */}
      <div className="border-t border-zinc-800 p-2">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all mb-1',
            collapsed && !mobile && 'justify-center',
          )}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {(!collapsed || mobile) && <span>{t('settings')}</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-all',
            collapsed && !mobile && 'justify-center',
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {(!collapsed || mobile) && <span>{t('logout')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <CommandPalette />

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
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
              <Sidebar mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 gap-4 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Command palette trigger */}
          <button
            onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
            className="group flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 h-9 text-sm text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors w-full max-w-xs"
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{t('search')}</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
              ⌘K
            </kbd>
          </button>

          <div className="flex-1" />
          <QuickAddMenu />
          <LanguageToggle />
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setBellOpen((o) => !o)}
              className="relative text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {inbox.unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {inbox.unread > 9 ? '9+' : inbox.unread}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-9 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                  <span className="text-sm font-semibold text-white">{t('notificationsTitle')}</span>
                  {inbox.unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-400 hover:underline">
                      {t('markAllRead')}
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {inbox.items.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-8">{t('noNotifications')}</p>
                  ) : (
                    inbox.items.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-colors ${
                          !n.isRead ? 'bg-blue-500/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.isRead && (
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                          )}
                          <div className={!n.isRead ? '' : 'pl-3.5'}>
                            <p className="text-sm font-medium text-zinc-200">{n.title}</p>
                            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.body}</p>
                            <p className="text-xs text-zinc-600 mt-1">
                              {new Date(n.createdAt).toLocaleString('en-BD')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-zinc-800">
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setBellOpen(false)}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    {t('viewAllNotifications')}
                  </Link>
                </div>
              </div>
            )}
          </div>
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full hover:bg-zinc-800 p-0.5 pr-2 transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-medium">
                {me ? `${me.firstName[0] ?? ''}${me.lastName[0] ?? ''}`.toUpperCase() : 'U'}
              </span>
              {me && <span className="hidden sm:block text-sm text-zinc-300 max-w-[8rem] truncate">{me.firstName}</span>}
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  {me && (
                    <div className="px-4 py-3 border-b border-zinc-800">
                      <p className="text-sm font-semibold text-white truncate">{me.firstName} {me.lastName}</p>
                      <p className="text-xs text-zinc-500 truncate">{me.email}</p>
                      <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {(['super_admin', 'school_admin', 'teacher', 'finance'] as const).includes(me.role as never)
                          ? t(`roles.${me.role as 'super_admin' | 'school_admin' | 'teacher' | 'finance'}`)
                          : me.role}
                      </span>
                    </div>
                  )}
                  <div className="p-1">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-zinc-400" /> {t('profileMenu.myProfile')}
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-zinc-400" /> {t('profileMenu.settings')}
                    </Link>
                    <button
                      onClick={() => { setProfileOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> {t('profileMenu.logout')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page content */}
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
