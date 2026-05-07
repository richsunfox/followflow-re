'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markThreadAsRead, generateDraftReply } from '@/app/(dashboard)/inbox/actions';
import { resumeSequence } from '@/app/(dashboard)/leads/actions';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InboxMessage {
  id:         string;
  leadId:     string | null;
  channel:    'sms' | 'email';
  fromPhone:  string | null;
  fromEmail:  string | null;
  subject:    string | null;
  body:       string;
  isRead:     boolean;
  receivedAt: string;
}

export interface ConversationThread {
  threadKey:      string;
  leadId:         string | null;
  leadFirstName:  string;
  leadLastName:   string;
  leadPhone:      string | null;
  leadEmail:      string | null;
  leadStatus:     string;
  sequencePaused: boolean;
  messages:       InboxMessage[];
  latestMessage:  InboxMessage;
  hasUnread:      boolean;
  unreadCount:    number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  new:       'bg-indigo-100 text-indigo-700',
  hot:       'bg-red-100 text-red-700',
  warm:      'bg-orange-100 text-orange-700',
  nurturing: 'bg-blue-100 text-blue-700',
  contacted: 'bg-purple-100 text-purple-700',
  cold:      'bg-slate-100 text-slate-600',
  converted: 'bg-green-100 text-green-700',
  dead:      'bg-gray-100 text-gray-500',
};

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-sky-500',
  'bg-teal-500',   'bg-emerald-500', 'bg-amber-500',
];

const labelCls = 'text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

// ── Helpers ───────────────────────────────────────────────────────────────────

function avatarColor(name: string): string {
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function initials(first: string, last: string): string {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

function relativeTime(iso: string): { label: string; title: string } {
  const abs  = new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs  = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  let label = '';
  if (mins < 1)       label = 'Just now';
  else if (mins < 60) label = `${mins}m ago`;
  else if (hrs < 24)  label = `${hrs}h ago`;
  else if (days < 7)  label = `${days}d ago`;
  else label = new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { label, title: abs };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ChannelIcon({ channel, size = 'sm' }: { channel: 'sms' | 'email'; size?: 'sm' | 'xs' }) {
  const dim = size === 'sm' ? 'w-4 h-4' : 'w-3 h-3';
  if (channel === 'sms') {
    return (
      <svg className={`${dim} text-sky-500 shrink-0`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18h3" />
      </svg>
    );
  }
  return (
    <svg className={`${dim} text-violet-500 shrink-0`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function InboxView({
  threads,
  totalUnread,
}: {
  threads:      ConversationThread[];
  totalUnread:  number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [expandedKey,    setExpandedKey]    = useState<string | null>(null);
  const [drafts,         setDrafts]         = useState<Record<string, string>>({});
  const [generatingKey,  setGeneratingKey]  = useState<string | null>(null);
  const [draftError,     setDraftError]     = useState<Record<string, string>>({});
  const [markingKey,     setMarkingKey]     = useState<string | null>(null);
  const [resumingId,     setResumingId]     = useState<string | null>(null);
  const [copiedKey,      setCopiedKey]      = useState<string | null>(null);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function toggleExpand(key: string) {
    setExpandedKey(prev => (prev === key ? null : key));
  }

  async function handleMarkRead(thread: ConversationThread) {
    if (markingKey) return;
    const unreadIds = thread.messages.filter(m => !m.isRead).map(m => m.id);
    if (unreadIds.length === 0) return;
    setMarkingKey(thread.threadKey);
    await markThreadAsRead(unreadIds);
    setMarkingKey(null);
    startTransition(() => router.refresh());
  }

  async function handleResume(thread: ConversationThread) {
    if (!thread.leadId || resumingId) return;
    setResumingId(thread.leadId);
    await resumeSequence(thread.leadId);
    setResumingId(null);
    startTransition(() => router.refresh());
  }

  async function handleGenerateDraft(thread: ConversationThread) {
    if (generatingKey) return;
    setGeneratingKey(thread.threadKey);
    setDraftError(prev => ({ ...prev, [thread.threadKey]: '' }));
    // Reply to the most recent message (index 0, since messages are DESC)
    const latest = thread.messages[0];
    const result = await generateDraftReply(latest.body, thread.leadFirstName, latest.channel);
    if (result.draft) {
      setDrafts(prev => ({ ...prev, [thread.threadKey]: result.draft! }));
    } else {
      setDraftError(prev => ({ ...prev, [thread.threadKey]: result.error ?? 'Failed to generate draft' }));
    }
    setGeneratingKey(null);
  }

  async function handleCopyDraft(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (threads.length === 0) {
    return (
      <div className="p-8">
        <PageHeader totalUnread={0} />
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1.5">No replies yet</h3>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
            Your sequences are running. We&apos;ll notify you the moment a lead responds.
          </p>
        </div>
      </div>
    );
  }

  // ── Thread list ────────────────────────────────────────────────────────────

  return (
    <div className="p-8">
      <PageHeader totalUnread={totalUnread} />

      <div className="space-y-3">
        {threads.map(thread => {
          const isExpanded = expandedKey === thread.threadKey;
          const name       = `${thread.leadFirstName} ${thread.leadLastName}`.trim() || thread.leadPhone || 'Unknown';
          const ts         = relativeTime(thread.latestMessage.receivedAt);
          const preview    = thread.latestMessage.body.length > 100
            ? thread.latestMessage.body.slice(0, 100) + '…'
            : thread.latestMessage.body;
          const statusStyle = STATUS_STYLES[thread.leadStatus] ?? 'bg-gray-100 text-gray-500';
          const avatarBg    = avatarColor(thread.leadFirstName + thread.leadLastName);
          const draft       = drafts[thread.threadKey];
          const draftErr    = draftError[thread.threadKey];
          const isGenerating = generatingKey === thread.threadKey;
          const isMarking    = markingKey    === thread.threadKey;
          const isResuming   = resumingId    === thread.leadId;

          return (
            <div
              key={thread.threadKey}
              className={[
                'bg-white rounded-xl overflow-hidden shadow-card transition-all duration-150',
                thread.hasUnread
                  ? 'border border-gray-200 border-l-4 border-l-indigo-500'
                  : 'border border-gray-200',
              ].join(' ')}
            >
              {/* ── Card header (always visible, clickable) ── */}
              <div
                className={[
                  'flex items-start gap-3.5 px-5 py-4 cursor-pointer select-none',
                  thread.hasUnread ? 'bg-indigo-50/40' : 'hover:bg-gray-50/60',
                  'transition-colors duration-100',
                ].join(' ')}
                onClick={() => toggleExpand(thread.threadKey)}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full ${avatarBg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <span className="text-white text-sm font-semibold">
                    {initials(thread.leadFirstName, thread.leadLastName)}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={`text-sm font-semibold text-gray-900 ${thread.hasUnread ? 'font-bold' : ''}`}>
                      {name}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize ${statusStyle}`}>
                      {thread.leadStatus}
                    </span>
                    {thread.sequencePaused && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-700">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                        </svg>
                        Paused
                      </span>
                    )}
                    {thread.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ChannelIcon channel={thread.latestMessage.channel} size="xs" />
                    <p className={`text-sm truncate ${thread.hasUnread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                      {preview}
                    </p>
                  </div>
                </div>

                {/* Timestamp + chevron */}
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs text-gray-400 tabular-nums" title={ts.title}>
                    {ts.label}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              {/* ── Expanded body ── */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-100">

                  {/* Contact info */}
                  {(thread.leadPhone || thread.leadEmail) && (
                    <div className="mt-4 mb-4">
                      <p className={labelCls}>Contact</p>
                      <div className="flex flex-wrap gap-3">
                        {thread.leadPhone && (
                          <span className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                            </svg>
                            {thread.leadPhone}
                          </span>
                        )}
                        {thread.leadEmail && (
                          <span className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                            </svg>
                            {thread.leadEmail}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Message thread (chronological — oldest first) */}
                  <div className="mb-4">
                    <p className={labelCls}>
                      {thread.messages.length === 1 ? 'Message' : `${thread.messages.length} messages`}
                    </p>
                    <div className="space-y-2.5">
                      {[...thread.messages].reverse().map(msg => {
                        const mt = relativeTime(msg.receivedAt);
                        return (
                          <div key={msg.id} className="relative pl-4 border-l-2 border-gray-100">
                            <div className="flex items-center gap-2 mb-1">
                              <ChannelIcon channel={msg.channel} size="xs" />
                              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                                {msg.channel}
                              </span>
                              {msg.subject && (
                                <span className="text-[11px] text-gray-400">— {msg.subject}</span>
                              )}
                              <span className="text-[11px] text-gray-300 ml-auto" title={mt.title}>
                                {mt.label}
                              </span>
                              {!msg.isRead && (
                                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {msg.body}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Primary actions */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {thread.hasUnread && (
                      <button
                        onClick={() => handleMarkRead(thread)}
                        disabled={isMarking}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        {isMarking ? (
                          <><SpinnerIcon /> Marking…</>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                            Mark as read
                          </>
                        )}
                      </button>
                    )}
                    {thread.sequencePaused && thread.leadId && (
                      <button
                        onClick={() => handleResume(thread)}
                        disabled={isResuming}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                      >
                        {isResuming ? (
                          <><SpinnerIcon /> Resuming…</>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                            </svg>
                            Resume sequence
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* AI Draft Reply */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                        </svg>
                        AI Draft Reply
                      </p>
                      <button
                        onClick={() => handleGenerateDraft(thread)}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
                      >
                        {isGenerating ? (
                          <><SpinnerIcon /> Generating…</>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                            </svg>
                            {draft ? 'Regenerate' : 'Generate draft'}
                          </>
                        )}
                      </button>
                    </div>

                    {draftErr && (
                      <p className="text-xs text-red-600 mb-2">{draftErr}</p>
                    )}

                    {draft && (
                      <div className="relative">
                        <textarea
                          readOnly
                          value={draft}
                          rows={4}
                          className="w-full text-sm text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                        />
                        <button
                          onClick={() => handleCopyDraft(thread.threadKey, draft)}
                          className={[
                            'absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                            copiedKey === thread.threadKey
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                          ].join(' ')}
                        >
                          {copiedKey === thread.threadKey ? (
                            <>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                              Copied
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                              </svg>
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {!draft && !isGenerating && !draftErr && (
                      <p className="text-xs text-gray-400 text-center py-2">
                        Generate a reply suggestion in your voice
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page header ───────────────────────────────────────────────────────────────

function PageHeader({ totalUnread }: { totalUnread: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-[#0F1629]">Inbox</h1>
        {totalUnread > 0 && (
          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
            {totalUnread}
          </span>
        )}
      </div>
      <p className="text-slate-500 text-sm mt-1">
        {totalUnread > 0
          ? `${totalUnread} unread repl${totalUnread === 1 ? 'y' : 'ies'} from leads`
          : 'Replies from your leads'}
      </p>
    </div>
  );
}
