'use client';

import Link from 'next/link';
import { SectionCard } from '@/components/ui/section-card';

export interface AtRiskItem {
  student: { id: string; firstName: string; lastName: string };
  reasons: string[];
}

export default function AtRiskPanel({ items }: { items: AtRiskItem[] }) {
  return (
    <SectionCard
      title="⚠ At-risk students"
      action={<span className="text-xs text-red-400">{items.length}</span>}
    >
      {items.length === 0 ? (
        <p className="text-sm text-zinc-600 py-4 text-center">No students flagged 🎉</p>
      ) : (
        <ul className="divide-y divide-zinc-800">
          {items.slice(0, 5).map((it) => (
            <li key={it.student.id} className="py-2">
              <Link href={`/dashboard/students/${it.student.id}`}
                className="text-sm text-zinc-200 hover:text-white">
                {it.student.firstName} {it.student.lastName}
              </Link>
              <p className="text-xs text-zinc-500">{it.reasons[0] ?? ''}</p>
            </li>
          ))}
        </ul>
      )}
      <Link href="/dashboard/at-risk" className="text-xs text-blue-400 hover:underline mt-2 inline-block">
        View all
      </Link>
    </SectionCard>
  );
}
