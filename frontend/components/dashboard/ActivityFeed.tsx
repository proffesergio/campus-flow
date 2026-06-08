'use client';

import { SectionCard } from '@/components/ui/section-card';

export interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
  actorName?: string;
}

function timeAgo(dateStr: string) {
  const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <SectionCard title="Recent activity">
      {items.length === 0 ? (
        <p className="text-sm text-zinc-600 py-4 text-center">No recent activity</p>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 6).map((it) => (
            <li key={it.id} className="text-xs text-zinc-400 py-1">
              <span className="text-zinc-200">{it.actorName ?? 'Someone'}</span> {it.action} {it.entity}
              <span className="text-zinc-600"> · {timeAgo(it.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
