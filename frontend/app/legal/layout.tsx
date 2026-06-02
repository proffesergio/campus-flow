import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

const docs = [
  { href: '/legal/privacy', label: 'Privacy Policy' },
  { href: '/legal/terms', label: 'Terms of Service' },
  { href: '/legal/dpa', label: 'Data Processing Agreement' },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="border-b border-zinc-800">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </span>
            <span className="font-bold text-white">CampusFlow</span>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-8">
        <nav className="flex flex-wrap gap-2 mb-8">
          {docs.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-300 hover:border-emerald-600 hover:text-emerald-400 transition-colors"
            >
              {d.label}
            </Link>
          ))}
        </nav>

        <article className="prose-legal">{children}</article>

        <footer className="mt-12 pt-6 border-t border-zinc-800 text-xs text-zinc-500">
          © {new Date().getFullYear()} CampusFlow. This document is a template provided for
          convenience and must be reviewed by qualified legal counsel before use with a real
          school.
        </footer>
      </div>
    </div>
  );
}
