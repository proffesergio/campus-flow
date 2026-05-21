'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookMarked, FileText, Link2, Video, StickyNote, Sparkles, Search, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

interface Material {
  id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'link' | 'video' | 'note';
  fileUrl: string;
  subject?: { name: string };
  class?: { name: string; section?: string };
  createdAt: string;
}

const TYPE_ICONS = {
  pdf: FileText,
  link: Link2,
  video: Video,
  note: StickyNote,
};

const TYPE_COLORS = {
  pdf: 'text-red-400 bg-red-500/10',
  link: 'text-blue-400 bg-blue-500/10',
  video: 'text-purple-400 bg-purple-500/10',
  note: 'text-amber-400 bg-amber-500/10',
};

export default function StudentPracticePage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ publishedOnly: 'true' });
    if (search) params.set('search', search);
    if (typeFilter) params.set('type', typeFilter);
    api.get<{ success: boolean; data: { items: Material[] } }>(`/practice-materials?${params}`)
      .then((r) => setMaterials(r.data.data?.items ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [search, typeFilter]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-indigo-400" />
            Practice Materials
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Resources shared by your teachers</p>
        </div>
        <Link
          href="/student/practice/generate"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          AI Practice Test
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search materials..."
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Types</option>
          <option value="pdf">PDF</option>
          <option value="link">Link</option>
          <option value="video">Video</option>
          <option value="note">Note</option>
        </select>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-zinc-800 rounded-xl" />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No materials available yet</p>
          <Link href="/student/practice/generate" className="text-sm text-indigo-400 hover:underline mt-2 block">
            Generate an AI practice test instead →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {materials.map((m, i) => {
            const Icon = TYPE_ICONS[m.type] ?? FileText;
            const colorClass = TYPE_COLORS[m.type] ?? TYPE_COLORS.note;
            return (
              <motion.a
                key={m.id}
                href={m.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-indigo-500/50 hover:bg-zinc-800/50 transition-all group block"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                        {m.title}
                      </p>
                      <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
                    </div>
                    {m.description && (
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{m.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {m.subject && (
                        <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                          {m.subject.name}
                        </span>
                      )}
                      <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${colorClass}`}>
                        {m.type}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.a>
            );
          })}
        </div>
      )}
    </div>
  );
}
