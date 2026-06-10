'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, History, Users, Mail, MessageSquare, Bell, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface NotificationLog {
  id: string;
  type: string;
  channel: string;
  subject: string;
  body: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  recipient: { firstName: string; lastName: string } | null;
  sender: { firstName: string; lastName: string } | null;
}

interface LogMeta { total: number; page: number; limit: number; totalPages: number }

const STATUS_STYLE: Record<string, string> = {
  sent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  queued: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const VARIABLES = ['{{studentName}}', '{{schoolName}}', '{{amount}}', '{{dueDate}}', '{{attendancePercent}}'];

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const tc = useTranslations('common');

  const TARGET_GROUPS = [
    { value: 'all_parents',  label: t('targetAllParents') },
    { value: 'all_teachers', label: t('targetAllTeachers') },
    { value: 'all_students', label: t('targetAllStudents') },
    { value: 'school_admin', label: t('targetAllAdmins') },
  ];

  const [tab, setTab] = useState<'compose' | 'logs'>('compose');

  // Compose state
  const [targetGroup, setTargetGroup] = useState('all_parents');
  const [channels, setChannels] = useState({ in_app: true, email: false, sms: false });
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [logMeta, setLogMeta] = useState<LogMeta | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [channelFilter, setChannelFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(logPage), limit: '20' });
      if (channelFilter) params.set('channel', channelFilter);
      const res = await api.get<{ success: boolean; data: NotificationLog[]; meta: LogMeta }>(
        `/notifications/logs?${params}`,
      );
      setLogs(res.data.data);
      setLogMeta(res.data.meta);
    } catch { toast.error(t('failedLoadLogs')); }
    finally { setLogsLoading(false); }
  }, [logPage, channelFilter, t]);

  useEffect(() => {
    if (tab === 'logs') fetchLogs();
  }, [tab, fetchLogs]);

  function insertVariable(v: string) {
    setMessage((prev) => prev + v);
  }

  function previewMessage() {
    return message
      .replace(/\{\{studentName\}\}/g, 'Rafi Ahmed')
      .replace(/\{\{schoolName\}\}/g, 'Dhaka Grammar School')
      .replace(/\{\{amount\}\}/g, '৳3,500')
      .replace(/\{\{dueDate\}\}/g, '15 June 2025')
      .replace(/\{\{attendancePercent\}\}/g, '87%');
  }

  async function handleSend() {
    if (!message.trim()) { toast.error(t('messageRequired')); return; }
    const activeChannels = Object.entries(channels).filter(([, v]) => v).map(([k]) => k);
    if (activeChannels.length === 0) { toast.error(t('selectChannel')); return; }
    if (!confirm(`Send to ${TARGET_GROUPS.find((g) => g.value === targetGroup)?.label} via ${activeChannels.join(', ')}?`)) return;
    setSending(true);
    try {
      await api.post('/notifications/broadcast', {
        targetGroup, channels: activeChannels, subject, message,
      });
      toast.success(t('broadcastSent'));
      setSubject('');
      setMessage('');
      setPreview(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('failedBroadcast'));
    }
    finally { setSending(false); }
  }

  const inputClass = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-zinc-500';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{t('subtitle')}</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-zinc-800">
        {[
          { key: 'compose', label: t('tabCompose'), icon: Send },
          { key: 'logs',    label: t('tabHistory'), icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Target group */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Users className="w-4 h-4" /> {t('recipients')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TARGET_GROUPS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setTargetGroup(g.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      targetGroup === g.value
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Channels */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">{t('channels')}</label>
              <div className="flex gap-3">
                {[
                  { key: 'in_app', label: t('channelInApp'), icon: Bell },
                  { key: 'email',  label: t('channelEmail'),  icon: Mail },
                  { key: 'sms',    label: t('channelSms'),    icon: MessageSquare },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setChannels((prev) => ({ ...prev, [key]: !prev[key as keyof typeof channels] }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      channels[key as keyof typeof channels]
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">{t('subjectEmailOnly')}</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t('subjectPlaceholder')}
                className={`${inputClass} h-10`}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">{t('message')} *</label>
              <textarea
                value={preview ? previewMessage() : message}
                onChange={(e) => !preview && setMessage(e.target.value)}
                readOnly={preview}
                rows={6}
                placeholder={t('messagePlaceholder')}
                className={`${inputClass} py-2.5 resize-none`}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? t('sending') : t('sendBroadcast')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPreview((v) => !v)}
                className="border-zinc-700 text-zinc-300 hover:text-white"
              >
                {preview ? t('edit') : t('preview')}
              </Button>
            </div>

            {preview && (
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 space-y-2">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{t('previewLabel')}</p>
                <p className="text-sm text-zinc-200 whitespace-pre-wrap">{previewMessage()}</p>
              </div>
            )}
          </div>

          {/* Sidebar: variable chips */}
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-zinc-300">{t('variablesTitle')}</p>
              <p className="text-xs text-zinc-500">{t('variablesHint')}</p>
              <div className="flex flex-col gap-2">
                {VARIABLES.map((v) => (
                  <button
                    key={v}
                    onClick={() => insertVariable(v)}
                    className="text-left px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-mono text-blue-400 hover:border-blue-500 transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-zinc-300">{t('tipsTitle')}</p>
              <ul className="text-xs text-zinc-500 space-y-1.5 list-disc list-inside">
                <li>{t('tip1')}</li>
                <li>{t('tip2')}</li>
                <li>{t('tip3')}</li>
                <li>{t('tip4')}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select
              value={channelFilter}
              onChange={(e) => { setChannelFilter(e.target.value); setLogPage(1); }}
              className="h-9 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-xs text-white"
            >
              <option value="">{t('allChannels')}</option>
              <option value="in_app">{t('channelInApp')}</option>
              <option value="email">{t('channelEmail')}</option>
              <option value="sms">{t('channelSms')}</option>
            </select>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {[
                    t('colType'), t('colChannel'), t('colSubject'),
                    t('colRecipient'), t('colStatus'), t('colSentAt'),
                  ].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-zinc-800/50">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20 bg-zinc-800" /></td>
                      ))}
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <CheckCircle className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                      <p className="text-zinc-500 text-sm">{t('noLogsSent')}</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {t(`typeLabels.${log.type}` as `typeLabels.${string}`) ?? log.type}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-400">
                        {log.channel === 'in_app' ? t('channelInApp') :
                         log.channel === 'email' ? t('channelEmail') :
                         log.channel === 'sms' ? t('channelSms') : log.channel}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300 max-w-48 truncate">{log.subject || '—'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-400">
                        {log.recipient ? `${log.recipient.firstName} ${log.recipient.lastName}` : t('recipientBroadcast')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[log.status] ?? STATUS_STYLE.queued}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500">
                        {log.sentAt ? new Date(log.sentAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {logMeta && logMeta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" disabled={logPage <= 1}
                onClick={() => setLogPage((p) => p - 1)} className="text-zinc-400">{tc('previous')}</Button>
              <span className="text-xs text-zinc-500">{tc('page')} {logPage} {tc('of')} {logMeta.totalPages}</span>
              <Button variant="ghost" size="sm" disabled={logPage >= logMeta.totalPages}
                onClick={() => setLogPage((p) => p + 1)} className="text-zinc-400">{tc('next')}</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
