'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateLeadStatus } from '@/app/(dashboard)/leads/actions';

export interface LeadDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  lead_type: string;
  status: string;
  priority: string;
  source: string | null;
  notes: string | null;
  budget_min: number | null;
  budget_max: number | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  sequence_day: number;
  sequence_paused: boolean;
  sequence_completed: boolean;
}

const STATUS_OPTIONS = [
  { value: 'new',       label: 'New',       cls: 'bg-indigo-100 text-indigo-700 ring-indigo-200' },
  { value: 'hot',       label: 'Hot',       cls: 'bg-red-100 text-red-700 ring-red-200' },
  { value: 'warm',      label: 'Warm',      cls: 'bg-orange-100 text-orange-700 ring-orange-200' },
  { value: 'nurturing', label: 'Nurturing', cls: 'bg-blue-100 text-blue-700 ring-blue-200' },
  { value: 'contacted', label: 'Contacted', cls: 'bg-purple-100 text-purple-700 ring-purple-200' },
  { value: 'cold',      label: 'Cold',      cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  { value: 'converted', label: 'Converted', cls: 'bg-green-100 text-green-700 ring-green-200' },
  { value: 'dead',      label: 'Dead',      cls: 'bg-gray-100 text-gray-500 ring-gray-200' },
];

const TYPE_STYLES: Record<string, string> = {
  buyer:  'bg-sky-100 text-sky-700',
  seller: 'bg-violet-100 text-violet-700',
  both:   'bg-teal-100 text-teal-700',
};

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-sky-500',
  'bg-teal-500', 'bg-emerald-500', 'bg-amber-500',
];

function avatarColor(name: string): string {
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function initials(first: string, last: string): string {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

function calcScore(status: string, priority: string): number {
  const base: Record<string, number> = { converted: 100, hot: 90, warm: 72, nurturing: 55, contacted: 42, new: 38, cold: 20, dead: 8 };
  const bonus: Record<string, number> = { high: 8, medium: 0, low: -8 };
  return Math.min(100, Math.max(0, (base[status] ?? 30) + (bonus[priority] ?? 0)));
}

function scoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-400';
  if (score >= 40) return 'bg-orange-400';
  return 'bg-gray-300';
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function relativeDate(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

function futureDateLabel(iso: string | null): { text: string; overdue: boolean } {
  if (!iso) return { text: '—', overdue: false };
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.floor(diff / 86_400_000);
  if (diff < 0) return { text: 'Overdue', overdue: true };
  if (days === 0) return { text: 'Today', overdue: false };
  if (days === 1) return { text: 'Tomorrow', overdue: false };
  if (days < 7) return { text: `In ${days}d`, overdue: false };
  return { text: formatDate(iso), overdue: false };
}

interface Props {
  lead: LeadDetail | null;
  onClose: () => void;
}

export default function LeadDetailModal({ lead, onClose }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(lead?.status ?? '');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<'phone' | 'email' | null>(null);

  // Sync status when lead changes
  useEffect(() => {
    setStatus(lead?.status ?? '');
  }, [lead?.id, lead?.status]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleStatusChange(newStatus: string) {
    if (!lead || newStatus === status || saving) return;
    setSaving(true);
    setStatus(newStatus);
    await updateLeadStatus(lead.id, newStatus);
    setSaving(false);
    router.refresh();
  }

  async function copyToClipboard(text: string, field: 'phone' | 'email') {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!lead) return null;

  const name  = `${lead.first_name} ${lead.last_name}`;
  const score = calcScore(lead.status, lead.priority);
  const followUp = futureDateLabel(lead.next_follow_up_at);
  const isBuyer = lead.lead_type === 'buyer' || lead.lead_type === 'both';

  const sequenceLabel = lead.sequence_completed
    ? 'Completed'
    : lead.sequence_paused
    ? 'Paused'
    : `Day ${lead.sequence_day + 1} of 7`;

  const sequenceStyle = lead.sequence_completed
    ? 'bg-green-100 text-green-700'
    : lead.sequence_paused
    ? 'bg-amber-100 text-amber-700'
    : 'bg-indigo-100 text-indigo-700';

  const labelCls = 'text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-gray-950/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${avatarColor(name)} flex items-center justify-center shrink-0`}>
              <span className="text-white text-sm font-semibold">{initials(lead.first_name, lead.last_name)}</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 leading-tight">{name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize ${TYPE_STYLES[lead.lead_type] ?? 'bg-gray-100 text-gray-600'}`}>
                  {lead.lead_type}
                </span>
                <span className="text-xs text-gray-400 capitalize">{lead.priority} priority</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-thin">

          {/* Status editor */}
          <div>
            <p className={labelCls}>Status {saving && <span className="text-indigo-400 normal-case font-normal">(saving…)</span>}</p>
            <div className="grid grid-cols-4 gap-1.5">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium text-center transition-all ring-1 ring-inset capitalize ${
                    status === opt.value
                      ? `${opt.cls} ring-2`
                      : 'bg-white text-gray-500 ring-gray-200 hover:ring-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact info */}
          {(lead.phone || lead.email) && (
            <div>
              <p className={labelCls}>Contact</p>
              <div className="space-y-2">
                {lead.phone && (
                  <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18h3" />
                      </svg>
                      <span className="text-sm text-gray-700">{lead.phone}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(lead.phone!, 'phone')}
                      className={`text-xs font-medium transition-colors ${copied === 'phone' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {copied === 'phone' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                      <span className="text-sm text-gray-700 truncate">{lead.email}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(lead.email!, 'email')}
                      className={`text-xs font-medium transition-colors shrink-0 ml-2 ${copied === 'email' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {copied === 'email' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Budget */}
          {isBuyer && (lead.budget_min || lead.budget_max) && (
            <div>
              <p className={labelCls}>Budget</p>
              <p className="text-sm text-gray-900">
                {lead.budget_min && lead.budget_max
                  ? `$${lead.budget_min.toLocaleString()} – $${lead.budget_max.toLocaleString()}`
                  : lead.budget_min
                  ? `From $${lead.budget_min.toLocaleString()}`
                  : `Up to $${lead.budget_max!.toLocaleString()}`}
              </p>
            </div>
          )}

          {/* Score */}
          <div>
            <p className={labelCls}>Lead score</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${scoreBarColor(score)}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-700 tabular-nums w-6">{score}</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={labelCls}>Last contact</p>
              <p
                className="text-sm text-gray-900"
                title={lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleString() : undefined}
              >
                {relativeDate(lead.last_contacted_at)}
              </p>
            </div>
            <div>
              <p className={labelCls}>Next follow-up</p>
              <p className={`text-sm font-medium ${followUp.overdue ? 'text-red-600' : 'text-gray-900'}`}
                title={lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleString() : undefined}
              >
                {followUp.text}
              </p>
            </div>
          </div>

          {/* Sequence status */}
          <div>
            <p className={labelCls}>AI Sequence</p>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sequenceStyle}`}>
                {sequenceLabel}
              </span>
              {lead.sequence_paused && !lead.sequence_completed && (
                <span className="text-xs text-amber-600">Paused — lead replied</span>
              )}
            </div>
          </div>

          {/* Source */}
          {lead.source && (
            <div>
              <p className={labelCls}>Source</p>
              <p className="text-sm text-gray-900 capitalize">{lead.source.replace('_', ' ')}</p>
            </div>
          )}

          {/* Notes */}
          {lead.notes && (
            <div>
              <p className={labelCls}>Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg px-3 py-2.5">
                {lead.notes}
              </p>
            </div>
          )}

          {/* Added date */}
          <div>
            <p className={labelCls}>Added</p>
            <p
              className="text-sm text-gray-500"
              title={new Date(lead.created_at).toLocaleString()}
            >
              {formatDate(lead.created_at)}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
