'use client';

import { useState } from 'react';
import { UploadCloud, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { parseCsv } from '@/lib/csv';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const REQUIRED = ['firstName', 'lastName', 'className', 'guardianName', 'guardianPhone'];
const TEMPLATE = 'firstName,lastName,className,section,rollNumber,guardianName,guardianPhone,guardianEmail,gender,dateOfBirth';

interface ImportResult { created: number; errors: { row: number; message: string }[] }

export default function StudentImportDialog({
  open, onClose, onImported,
}: { open: boolean; onClose: () => void; onImported: () => void }) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const missing = REQUIRED.filter((c) => !headers.includes(c));

  function reset() {
    setRows([]); setHeaders([]); setFileName(''); setResult(null);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setFileName(file.name);
    const text = await file.text();
    const parsed = parseCsv(text);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
  }

  async function doImport() {
    if (rows.length === 0) { toast.error('Choose a CSV file first'); return; }
    if (missing.length > 0) { toast.error(`Missing required column(s): ${missing.join(', ')}`); return; }
    setImporting(true);
    try {
      const res = await api.post<{ success: boolean; data: ImportResult }>('/students/import', { rows });
      setResult(res.data.data);
      if (res.data.data.created > 0) {
        toast.success(`Imported ${res.data.data.created} student${res.data.data.created === 1 ? '' : 's'}`);
        onImported();
      }
      if (res.data.data.errors.length > 0 && res.data.data.created === 0) {
        toast.error('No rows imported — see errors');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  function handleClose() { reset(); onClose(); }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-white">Import students from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV with a header row. Class is matched by name (+ section).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-zinc-700 rounded-xl py-8 cursor-pointer hover:border-zinc-600 transition-colors">
            <UploadCloud className="w-8 h-8 text-zinc-500" />
            <span className="text-sm text-zinc-400">{fileName || 'Click to choose a .csv file'}</span>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
          </label>

          <p className="text-xs text-zinc-600">
            Columns: <code className="text-zinc-400">{TEMPLATE}</code>. Required: {REQUIRED.join(', ')}.
          </p>

          {headers.length > 0 && !result && (
            <div className="text-sm">
              <p className="text-zinc-300">{rows.length} row{rows.length === 1 ? '' : 's'} detected.</p>
              {missing.length > 0 && (
                <p className="text-red-400 inline-flex items-center gap-1.5 mt-1">
                  <AlertTriangle className="w-4 h-4" /> Missing column(s): {missing.join(', ')}
                </p>
              )}
            </div>
          )}

          {result && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 max-h-48 overflow-y-auto">
              <p className="text-sm text-emerald-400 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {result.created} created
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-red-400">{result.errors.length} failed:</p>
                  <ul className="mt-1 space-y-0.5">
                    {result.errors.slice(0, 50).map((e) => (
                      <li key={e.row} className="text-xs text-zinc-500">Row {e.row}: {e.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} className="text-zinc-400">
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button onClick={doImport} disabled={importing || rows.length === 0 || missing.length > 0}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              {importing && <Loader2 className="w-4 h-4 animate-spin" />}
              Import {rows.length > 0 ? `${rows.length} rows` : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
