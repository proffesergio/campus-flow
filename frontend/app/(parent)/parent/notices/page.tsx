'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';

interface Notice {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
}

export default function ParentNotices() {
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: boolean; data: { items: Notice[] } }>('/parents/me/notices')
      .then((r) => setItems(r.data.data.items ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">Notices</h1>

      {loading && <div className="h-20 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />}

      {!loading && items.length === 0 && (
        <div className="text-center py-16 text-zinc-500">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No notices yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-xl border ${
              n.isRead ? 'bg-zinc-900 border-zinc-800' : 'bg-emerald-950/20 border-emerald-800/50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-white">{n.title}</p>
              <span className="text-xs text-zinc-500 flex-shrink-0">
                {new Date(n.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-1 whitespace-pre-wrap">{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
