'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  LayoutDashboard, Users, ClipboardCheck, BookOpen, DollarSign,
  Bell, Bot, BookMarked, Settings, Search, Loader2, GraduationCap,
  CornerDownLeft, ArrowUpRight,
} from 'lucide-react';
import { api } from '@/lib/api';

interface StudentHit {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string | null;
  class?: { name: string; section: string | null } | null;
}

const NAV_COMMANDS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, keywords: 'home overview' },
  { label: 'Students', href: '/dashboard/students', icon: Users, keywords: 'pupils enrollment' },
  { label: 'Attendance', href: '/dashboard/attendance', icon: ClipboardCheck, keywords: 'present absent mark' },
  { label: 'Attendance Reports', href: '/dashboard/attendance/reports', icon: ClipboardCheck, keywords: 'summary' },
  { label: 'Exams & Grades', href: '/dashboard/exams', icon: BookOpen, keywords: 'marks results tests' },
  { label: 'Finance', href: '/dashboard/finance', icon: DollarSign, keywords: 'fees invoices payments' },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell, keywords: 'broadcast alerts' },
  { label: 'AI Assistant', href: '/dashboard/ai', icon: Bot, keywords: 'chat reports gpt claude' },
  { label: 'Practice Materials', href: '/dashboard/practice', icon: BookMarked, keywords: 'worksheets generate' },
  { label: 'Appearance Settings', href: '/dashboard/settings/appearance', icon: Settings, keywords: 'theme colors logo branding' },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<StudentHit[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Open on ⌘K / Ctrl+K, and on a window event (so the header button can trigger it).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('open-command-palette', onOpenEvent);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('open-command-palette', onOpenEvent);
    };
  }, []);

  // Debounced student search.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setStudents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get<{ success: boolean; items: StudentHit[] }>(
          `/students?search=${encodeURIComponent(q)}&limit=6`,
        );
        setStudents(res.data.items ?? []);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery('');
      setStudents([]);
      router.push(href);
    },
    [router],
  );

  // Reset transient state when the dialog closes.
  useEffect(() => {
    if (!open) {
      setQuery('');
      setStudents([]);
      setLoading(false);
    }
  }, [open]);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Menu"
      shouldFilter={false}
      overlayClassName="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0"
      contentClassName="fixed left-1/2 top-[18%] z-[101] w-[92vw] max-w-xl -translate-x-1/2"
      className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
    >
          {/* Input */}
          <div className="flex items-center gap-2 border-b border-zinc-800 px-4">
            <Search className="h-4 w-4 shrink-0 text-zinc-500" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              autoFocus
              placeholder="Search students or jump to a page…"
              className="h-12 w-full bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
            />
            {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-zinc-500" />}
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="py-10 text-center text-sm text-zinc-500">
              No results found.
            </Command.Empty>

            {/* Student results */}
            {students.length > 0 && (
              <Command.Group
                heading="Students"
                className="mb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-zinc-600"
              >
                {students.map((s) => (
                  <Command.Item
                    key={s.id}
                    value={`student-${s.id}`}
                    onSelect={() => go(`/dashboard/students/${s.id}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-zinc-300 aria-selected:bg-zinc-800 aria-selected:text-white"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600/15 text-xs font-semibold text-blue-400">
                      {s.firstName.charAt(0)}
                      {s.lastName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {s.rollNumber ? `Roll ${s.rollNumber}` : 'No roll'}
                        {s.class ? ` · ${s.class.name}${s.class.section ? ` – ${s.class.section}` : ''}` : ''}
                      </p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Navigation */}
            <Command.Group
              heading="Navigation"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-zinc-600"
            >
              {NAV_COMMANDS.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <Command.Item
                    key={cmd.href}
                    value={`nav ${cmd.label} ${cmd.keywords}`}
                    onSelect={() => go(cmd.href)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-zinc-300 aria-selected:bg-zinc-800 aria-selected:text-white"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
                    <span className="flex-1">{cmd.label}</span>
                    <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-zinc-700 opacity-0 aria-selected:opacity-100" />
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2 text-[11px] text-zinc-600">
            <span className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" /> CampusFlow
            </span>
            <span className="flex items-center gap-2">
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-sans">↵</kbd>
              to select
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-sans">esc</kbd>
              to close
            </span>
          </div>
    </Command.Dialog>
  );
}
