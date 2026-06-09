'use client';

import { Input } from '@/components/ui/input';

export function AvatarField({
  value, onChange, initials,
}: { value?: string; onChange: (v: string) => void; initials?: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-lg font-bold overflow-hidden flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : (initials || '?')}
      </div>
      <div className="flex-1">
        <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="Image URL (https://…)" />
        <p className="text-xs text-zinc-600 mt-1">Paste an image URL. File upload coming later.</p>
      </div>
    </div>
  );
}
