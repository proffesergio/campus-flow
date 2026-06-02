'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Users } from 'lucide-react';
import { api } from '@/lib/api';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string | null;
  photoUrl: string | null;
  status: string;
  class: { id: string; name: string; section: string | null; academicYear: string } | null;
}

export default function ParentHome() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<{ success: boolean; data: Child[] }>('/parents/me/children')
      .then((r) => setChildren(r.data.data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Children</h1>
        <p className="text-sm text-zinc-400 mt-1">Tap a child to view attendance, results and fees.</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-red-400">Couldn&apos;t load your children. Please try again later.</p>
      )}

      {!loading && !error && children.length === 0 && (
        <div className="text-center py-16 text-zinc-500">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No children are linked to your account yet.</p>
          <p className="text-xs mt-1">Please contact the school office to link your child.</p>
        </div>
      )}

      <div className="space-y-3">
        {children.map((c) => {
          const initials = `${c.firstName[0] ?? ''}${c.lastName[0] ?? ''}`.toUpperCase();
          const cls = c.class
            ? `${c.class.name}${c.class.section ? ` ${c.class.section}` : ''}`
            : '—';
          return (
            <Link
              key={c.id}
              href={`/parent/children/${c.id}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-700 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white truncate">
                  {c.firstName} {c.lastName}
                </p>
                <p className="text-sm text-zinc-400 truncate">
                  {cls}
                  {c.rollNumber ? ` · Roll ${c.rollNumber}` : ''}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
