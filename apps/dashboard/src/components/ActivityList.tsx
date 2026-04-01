'use client';

import { useState, useTransition } from 'react';
import { resumeSequence } from '@/app/(dashboard)/leads/actions';
import { useRouter } from 'next/navigation';

export interface ActivityItem {
  id:           string;
  direction:    'outbound' | 'inbound';
  channel:      'sms' | 'email';
  leadName:     string;
  leadId:       string | null;
  subject:      string | null;
  body:         string;
  status:       string;
  ai_generated: boolean;
  timestamp:    string;
}

type FeedFilter = 'all' | 'sms' | 'email' | 'replies';

const PAGE_SIZE = 25;

const STATUS_STYLES: Record<string, string> = {
  sent:      'bg-green-100 text-green-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  pending:   'bg-yellow-100 text-yellow-700',
  failed:    'bg-red-100 text-red-700',
  bounced:   'bg-orange-100 text-orange-700',
  received:  'bg-indigo-100 text-indigo-700',
};

function SMSIcon({ inbound }: { inbound?: boolean }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${inbound ? 'bg-emerald-100' : 'bg-sky-100'}`}>
      <svg className={`w-4 h-4 ${inbound ? 'text-emerald-600' : 'text-sky-600'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18h3" />
      </svg>
    </div>
  );
}

function EmailIcon({ inbound }: { inbound?: boolean }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${inbound ? 'bg-teal-100' : 'bg-violet-100'}`}>
      <svg className={`w-4 h-4 ${inbound ? 'text-teal-600' : 'text-violet-600'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    </div>
  );
}

function relativeDate(iso: string): { label: string; title: string } {
  const abs  = new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs  = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  let label = '';
  if (mins < 1)  label = 'Just now';
  else if (mins < 60) label = `${mins}m ago`;
  else if (hrs < 24)  label = `${hrs}h ago`;
  else if (days < 7)  label = `${days}d ago`;
  else label = new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { label, title: abs };
}

export default function ActivityList({ feed }: { feed: ActivityItem[] }) {
  const router = useRouter();
  const [filter, setFilter]         = useState<FeedFilter>('all');
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());
  const [leadSearch, setLeadSearch] = useState('');
  const [page, setPage]             = useState(1);
  const [resuming, setResuming]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = feed.filter(item => {
    if (filter === 'replies') return item.direction === 'inbound';
    if (filter === 'sms')     return item.channel === 'sms';
    if (filter === 'email')   return item.channel === 'email';
    return true;
  }).filter(item =>
    leadSearch === '' || item.leadName.toLowerCase().includes(leadSearch.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    all:     feed.length,
    sms:     feed.filter(f => f.channel === 'sms').length,
    email:   feed.filter(f => f.channel === 'email').length,
    replies: feed.filter(f => f.direction === 'inbound').length,
  };

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleResume(leadId: string) {
    setResuming(leadId);
    await resumeSequence(leadId);
    setResuming(null);
    startTransition(() => router.refresh());
  }

  const TABS: { key: FeedFilter; label: string }[] = [
    { key: 'all',     label: 'All' },
    { key: 'sms',     label: 'SMS' },
    { key: 'email',   label: 'Email' },
    { key: 'replies', label: 'Replies' },
  ];

  return (
    <div>
      {/* Controls row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        {/* Lead search */}
        <div className="relative max-w-xs w-full sm:w-auto">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Filter by lead name…"
            value={leadSearch}
            onChange={e => { setLeadSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setFilter(tab.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wide transition-colors ${
                filter === tab.key
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 ${filter === tab.key ? 'text-indigo-200' : 'text-gray-400'}`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
          <p className="text-sm font-medium text-gray-500">
            {leadSearch ? `No messages for "${leadSearch}"` : filter === 'replies' ? 'No replies yet' : 'No messages in the last 30 days'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {filter === 'replies' ? 'When a lead replies, it appears here' : 'Activity appears here as the AI works'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
            {paginated.map(item => {
              const isExpanded = expanded.has(item.id);
              const isInbound  = item.direction === 'inbound';
              const ts         = relativeDate(item.timestamp);
              const preview    = item.channel === 'email' && item.subject
                ? item.subject
                : item.body.slice(0, 100) + (item.body.length > 100 ? '…' : '');

              return (
                <div key={item.id} className="px-4 py-3.5">
                  <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => toggleExpand(item.id)}
                  >
                    {item.channel === 'sms'
                      ? <SMSIcon inbound={isInbound} />
                      : <EmailIcon inbound={isInbound} />}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm">{item.leadName}</span>
                        {isInbound ? (
                          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">Reply ↩</span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${STATUS_STYLES[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {item.status}
                          </span>
                        )}
                        {item.ai_generated && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                            </svg>
                            AI
                          </span>
                        )}
                        <span className="text-xs text-gray-400 uppercase tracking-wide">{item.channel}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 truncate">{preview}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400 tabular-nums" title={ts.title}>{ts.label}</span>
                      <svg
                        className={`w-4 h-4 text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 ml-11 pl-3 border-l-2 border-gray-100">
                      {item.channel === 'email' && item.subject && (
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                          Subject: {item.subject}
                        </div>
                      )}
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{item.body}</p>
                      {isInbound && (
                        <div className="flex items-center gap-3 mt-3">
                          <p className="text-xs text-amber-600 font-medium">↩ Inbound reply — sequence paused</p>
                          {item.leadId && (
                            <button
                              onClick={() => handleResume(item.leadId!)}
                              disabled={resuming === item.leadId}
                              className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              {resuming === item.leadId ? (
                                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                </svg>
                              )}
                              {resuming === item.leadId ? 'Resuming…' : 'Resume sequence'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-xs text-gray-400">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-xs font-medium text-gray-700">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
