'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@radix-ui/react-dropdown-menu';
import { Plus, UserPlus, Layers, Library, BookOpen, Bell } from 'lucide-react';

const ITEM_DEFS = [
  { labelKey: 'quickAddStudent', icon: UserPlus, href: '/dashboard/students?new=1' },
  { labelKey: 'quickAddClass', icon: Layers, href: '/dashboard/classes?new=1' },
  { labelKey: 'quickAddSubject', icon: Library, href: '/dashboard/subjects?new=1' },
  { labelKey: 'quickAddExam', icon: BookOpen, href: '/dashboard/exams/new' },
  { labelKey: 'quickAddNotice', icon: Bell, href: '/dashboard/notifications?new=1' },
];

export default function QuickAddMenu() {
  const router = useRouter();
  const t = useTranslations('dashboard');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-9 px-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity outline-none">
          <Plus className="w-4 h-4" /> {t('quickAddNew')}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1 z-50"
      >
        {ITEM_DEFS.map(({ labelKey, icon: Icon, href }) => (
          <DropdownMenuItem
            key={labelKey}
            onSelect={() => router.push(href)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 outline-none cursor-pointer"
          >
            <Icon className="w-4 h-4 text-zinc-400" /> {t(labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
