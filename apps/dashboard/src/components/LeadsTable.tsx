'use client';

import { useState } from 'react';
import LeadDetailModal, { type LeadDetail } from './LeadDetailModal';

const PAGE_SIZE = 20;

const STATUS_TABS = ['all', 'new', 'hot', 'warm', 'nurturing', 'contacted', 'cold', 'converted'] as const;

const STATUS_STYLES: Record<string, string> = {
  hot:       'bg-red-100 text-red-700 ring-red-200',
  warm:      'bg-orange-100 text-orange-700 ring-orange-200',
  nurturing: 'bg-blue-100 text-blue-700 ring-blue-200',
  new:       'bg-indigo-100 text-indigo-700 ring-indigo-200',
  contacted: 'bg-purple-100 text-purple-700 ring-purple-200',
  cold:      'bg-slate-100 text-slate-600 ring-slate-200',
  dead:      'bg-gray-100 text-gray-500 ring-gray-200',
  converted: 'bg-green-100 text-green-700 ring-green-200',
  replied:   'bg-emerald-100 text-emerald-700 ring-emerald-200',
};

const TYPE_STYLES: Record<string, string> = {
  buyer:  'bg-sky-100 text-sky-700',
  seller: 'bg-violet-100 text-violet-700',
  both:   'bg-teal-100 text-teal-700',
};

type SortKey = 'score' | 'last_contacted_at' | 'next_follow_up_at' | 'created_at';
type SortDir = 'asc' | 'desc';

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

function initials(first: string | null, last: string | null): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

function avatarColor(name: string): string {
  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-sky-500', 'bg-teal-500', 'bg-emerald-500', 'bg-amber-500'];
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colors.length;
  return colors[idx];
}

function relativeDate(iso: string | null): { label: string; title: string } {
  if (!iso) return { label: '—', title: '' };
  const abs = new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  let label = '';
  if (days === 0) label = 'Today';
  else if (days === 1) label = 'Yesterday';
  else if (days < 7) label = `${days}d ago`;
  else if (days < 30) label = `${Math.floor(days / 7)}w ago`;
  else label = `${Math.floor(days / 30)}mo ago`;
  return { label, title: abs };
}

function futureDate(iso: string | null): { label: string; overdue: boolean; title: string } {
  if (!iso) return { label: '—', overdue: false, title: '' };
  const abs = new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.floor(diff / 86_400_000);
  if (diff < 0) return { label: 'Overdue', overdue: true, title: abs };
  if (days === 0) return { label: 'Today', overdue: false, title: abs };
  if (days === 1) return { label: 'Tomorrow', overdue: false, title: abs };
  if (days < 7) return { label: `In ${days}d`, overdue: false, title: abs };
  return { label: new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), overdue: false, title: abs };
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg className={`w-3 h-3 ml-1 inline-block transition-transform ${active ? 'text-indigo-600' : 'text-gray-300'} ${active && dir === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}

export default function LeadsTable({ leads }: { leads: LeadDetail[] }) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch]       = useState('');
  const [sortKey, setSortKey]     = useState<SortKey>('created_at');
  const [sortDir, setSortDir]     = useState<SortDir>('desc');
  const [page, setPage]           = useState(1);
  const [selectedLead, setSelectedLead] = useState<LeadDetail | null>(null);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  }

  const filtered = leads.filter(lead => {
    const matchesTab    = activeTab === 'all' || lead.status === activeTab;
    const matchesSearch = search === '' || (
      `${lead.first_name} ${lead.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      (lead.source ?? '').toLowerCase().includes(search.toLowerCase())
    );
    return matchesTab && matchesSearch;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let aVal: number, bVal: number;
    if (sortKey === 'score') {
      aVal = calcScore(a.status, a.priority);
      bVal = calcScore(b.status, b.priority);
    } else {
      aVal = a[sortKey] ? new Date(a[sortKey]!).getTime() : 0;
      bVal = b[sortKey] ? new Date(b[sortKey]!).getTime() : 0;
    }
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab] = tab === 'all' ? leads.length : leads.filter(l => l.status === tab).length;
    return acc;
  }, {} as Record<string, number>);

  function ThSort({ col, label }: { col: SortKey; label: string }) {
    return (
      <th
        className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
        onClick={() => handleSort(col)}
      >
        {label}
        <SortIcon active={sortKey === col} dir={sortDir} />
      </th>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search leads…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab}
              {counts[tab] > 0 && (
                <span className={`ml-1.5 ${activeTab === tab ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
          <p className="text-sm font-medium text-gray-500">No leads found</p>
          <p className="text-xs text-gray-400 mt-1">Try a different filter or add your first lead</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lead</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <ThSort col="score"              label="Score" />
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                  <ThSort col="last_contacted_at"  label="Last Contact" />
                  <ThSort col="next_follow_up_at"  label="Next Follow-up" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(lead => {
                  const score   = calcScore(lead.status, lead.priority);
                  const name    = `${lead.first_name} ${lead.last_name}`;
                  const lc      = relativeDate(lead.last_contacted_at);
                  const nfu     = futureDate(lead.next_follow_up_at);
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${avatarColor(name)} flex items-center justify-center shrink-0`}>
                            <span className="text-white text-xs font-semibold">{initials(lead.first_name, lead.last_name)}</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{name}</div>
                            <div className="text-xs text-gray-400 capitalize">{lead.priority} priority</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize ${TYPE_STYLES[lead.lead_type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {lead.lead_type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset capitalize ${STATUS_STYLES[lead.status] ?? 'bg-gray-100 text-gray-600 ring-gray-200'}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${scoreBarColor(score)}`} style={{ width: `${score}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-600 tabular-nums w-6">{score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-gray-500 text-xs capitalize">
                          {lead.source?.replace('_', ' ') ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-gray-500 text-xs tabular-nums" title={lc.title}>{lc.label}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-medium tabular-nums ${nfu.overdue ? 'text-red-600' : 'text-gray-500'}`} title={nfu.title}>
                          {nfu.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-xs text-gray-400">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-xs font-medium text-gray-700">
                  {page} / {totalPages}
                </span>
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

      {/* Lead detail drawer */}
      <LeadDetailModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </div>
  );
}
