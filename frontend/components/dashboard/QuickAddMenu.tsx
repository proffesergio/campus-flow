'use client';

import { useRouter } from 'next/navigation';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@radix-ui/react-dropdown-menu';
import { Plus, UserPlus, Layers, Library, BookOpen, Bell } from 'lucide-react';

const ITEMS = [
  { label: 'New Student', icon: UserPlus, href: '/dashboard/students?new=1' },
  { label: 'New Class', icon: Layers, href: '/dashboard/classes?new=1' },
  { label: 'New Subject', icon: Library, href: '/dashboard/subjects?new=1' },
  { label: 'New Exam', icon: BookOpen, href: '/dashboard/exams/new' },
  { label: 'New Notice', icon: Bell, href: '/dashboard/notifications?new=1' },
];

export default function QuickAddMenu() {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-9 px-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity outline-none">
          <Plus className="w-4 h-4" /> New
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1 z-50"
      >
        {ITEMS.map(({ label, icon: Icon, href }) => (
          <DropdownMenuItem
            key={label}
            onSelect={() => router.push(href)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 outline-none cursor-pointer"
          >
            <Icon className="w-4 h-4 text-zinc-400" /> {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
