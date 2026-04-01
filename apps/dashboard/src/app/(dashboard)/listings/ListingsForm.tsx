'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateListingContent, type ListingFormValues, type ListingOutputs, type ListingHistoryItem } from './actions';

const PROPERTY_TYPES = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'condo',         label: 'Condo' },
  { value: 'townhouse',     label: 'Townhouse' },
  { value: 'multi_family',  label: 'Multi-Family' },
  { value: 'land',          label: 'Land' },
  { value: 'other',         label: 'Other' },
];

const DEFAULT: ListingFormValues = {
  address: '', city: '', price: '', bedrooms: '',
  bathrooms: '', sqft: '', propertyType: 'single_family',
  keyFeatures: '', agentNotes: '',
};

function wordCount(str: string) { return str.trim().split(/\s+/).filter(Boolean).length; }
function charCount(str: string) { return str.trim().length; }

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Output card ──────────────────────────────────────────────────────────────

function OutputCard({
  icon, title, badge, content, copyText, copied, onCopy,
}: {
  icon: React.ReactNode; title: string; badge: string;
  content: string; copyText: string; copied: boolean; onCopy: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">{icon}</div>
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          <span className="px-2 py-0.5 rounded-md bg-gray-200 text-gray-500 text-xs font-medium">{badge}</span>
        </div>
        <button
          onClick={onCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            copied ? 'bg-green-100 text-green-700' : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {copied ? (
            <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>Copied!</>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" /></svg>Copy</>
          )}
        </button>
      </div>
      <div className="flex-1 px-4 py-3.5 overflow-y-auto max-h-52">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="w-7 h-7 rounded-lg bg-gray-200" />
        <div className="h-3.5 w-28 bg-gray-200 rounded" />
        <div className="h-3.5 w-12 bg-gray-200 rounded ml-1" />
      </div>
      <div className="px-4 py-3.5 space-y-2">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${[100,83,100,67,100,75][i-1]}%` }} />)}
      </div>
    </div>
  );
}

// ─── History row ──────────────────────────────────────────────────────────────

const PROP_TYPE_LABELS: Record<string, string> = {
  single_family: 'Single Family',
  condo:         'Condo',
  townhouse:     'Townhouse',
  multi_family:  'Multi-Family',
  land:          'Land',
  other:         'Other',
};

function HistoryRow({ item, onExpand, expanded, index }: {
  item: ListingHistoryItem; onExpand: () => void; expanded: boolean; index: number;
}) {
  const price = item.price ? `$${Number(item.price).toLocaleString()}` : null;
  const specs = [
    item.bedrooms  ? `${item.bedrooms}bd` : null,
    item.bathrooms ? `${item.bathrooms}ba` : null,
    item.sqft      ? `${Number(item.sqft).toLocaleString()} sqft` : null,
  ].filter(Boolean).join(' · ');

  const absDate = new Date(item.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Cycle through accent colors for visual variety
  const accents = ['bg-indigo-500', 'bg-violet-500', 'bg-sky-500', 'bg-teal-500', 'bg-emerald-500'];
  const accent  = accents[index % accents.length];

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={onExpand}
        className="w-full text-left flex items-stretch hover:bg-gray-50 transition-colors"
      >
        {/* Accent strip */}
        <div className={`w-1 shrink-0 ${accent} ${expanded ? 'opacity-100' : 'opacity-30'} transition-opacity`} />

        <div className="flex-1 flex items-start gap-4 px-5 py-3.5 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900 truncate">{item.address}, {item.city}</span>
              {price && <span className="text-sm text-indigo-600 font-semibold shrink-0">{price}</span>}
              {item.property_type && (
                <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-medium shrink-0">
                  {PROP_TYPE_LABELS[item.property_type] ?? item.property_type}
                </span>
              )}
            </div>
            {specs && <p className="text-xs text-gray-400 mt-0.5">{specs}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-400 tabular-nums" title={absDate}>{relativeDate(item.created_at)}</span>
            <svg className={`w-4 h-4 text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </button>

      {expanded && item.description && (
        <div className="px-6 pb-5 pt-2 space-y-4 bg-gray-50 border-t border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">MLS Description</p>
            <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
          </div>
          {item.social_caption && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Instagram Caption</p>
              <p className="text-sm text-gray-600 leading-relaxed">{item.social_caption}</p>
            </div>
          )}
          {item.email_subject && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Email Subject</p>
              <p className="text-sm text-gray-600">{item.email_subject}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ListingsForm({ history }: { history: ListingHistoryItem[] }) {
  const router = useRouter();
  const [form, setForm]       = useState<ListingFormValues>(DEFAULT);
  const [outputs, setOutputs] = useState<ListingOutputs | null>(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function set(field: keyof ListingFormValues, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setOutputs(null);
    setLoading(true);

    const result = await generateListingContent(form);

    if (result.error) {
      setError(result.error);
    } else if (result.outputs) {
      setOutputs(result.outputs);
      router.refresh(); // re-fetch history from server
    }
    setLoading(false);
  }

  const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder-gray-400';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

  const docIcon = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
  const cameraIcon = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
  );
  const emailIcon = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );

  return (
    <div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">

        {/* ── Left: Form ── */}
        <form onSubmit={handleGenerate} className="space-y-5 bg-white rounded-xl border border-gray-200 p-6">

          <div>
            <label className={labelCls}>Street address</label>
            <input type="text" className={inputCls} placeholder="1234 Maple Lane"
              value={form.address} onChange={e => set('address', e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>City</label>
              <input type="text" className={inputCls} placeholder="Pasadena"
                value={form.city} onChange={e => set('city', e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>List price ($)</label>
              <input type="number" className={inputCls} placeholder="875000" min={0}
                value={form.price} onChange={e => set('price', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Beds</label>
              <input type="number" className={inputCls} placeholder="3" min={0}
                value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Baths</label>
              <input type="number" className={inputCls} placeholder="2" min={0} step={0.5}
                value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Sq ft</label>
              <input type="number" className={inputCls} placeholder="1450" min={0}
                value={form.sqft} onChange={e => set('sqft', e.target.value)} required />
            </div>
          </div>

          <div>
            <label className={labelCls}>Property type</label>
            <select className={inputCls} value={form.propertyType}
              onChange={e => set('propertyType', e.target.value)}>
              {PROPERTY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Key features <span className="text-gray-400 font-normal">(comma separated)</span></label>
            <textarea className={`${inputCls} resize-none`} rows={3}
              placeholder="e.g. updated kitchen with quartz counters, hardwood floors, private backyard with pool, 2-car garage"
              value={form.keyFeatures} onChange={e => set('keyFeatures', e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>
              Agent notes <span className="text-gray-400 font-normal">(private — informs AI, not published)</span>
            </label>
            <textarea className={`${inputCls} resize-none`} rows={2}
              placeholder="e.g. sellers need 30-day leaseback, priced below comp at 45 Elm, motivated — will consider offers below ask"
              value={form.agentNotes} onChange={e => set('agentNotes', e.target.value)} />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 bg-red-50 border border-red-200 rounded-lg">
              <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition flex items-center justify-center gap-2">
            {loading ? (
              <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating all three…</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>Generate MLS · Social · Email</>
            )}
          </button>
        </form>

        {/* ── Right: Results ── */}
        <div className="space-y-4">
          {!loading && !outputs && (
            <div className="bg-white rounded-xl border border-gray-200 border-dashed flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">Three outputs will appear here</p>
              <p className="text-xs text-gray-400 mt-1">MLS copy · Social caption · Buyer email</p>
            </div>
          )}

          {loading && <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>}

          {outputs && (
            <>
              <OutputCard icon={docIcon} title="MLS Description" badge={`${wordCount(outputs.mls)} words`}
                content={outputs.mls} copyText={outputs.mls} copied={copiedKey === 'mls'} onCopy={() => copy(outputs.mls, 'mls')} />
              <OutputCard icon={cameraIcon} title="Instagram Caption" badge={`${charCount(outputs.social)} chars`}
                content={outputs.social} copyText={outputs.social} copied={copiedKey === 'social'} onCopy={() => copy(outputs.social, 'social')} />
              <OutputCard icon={emailIcon} title="Just-Listed Email" badge={`${wordCount(outputs.emailBody)} words`}
                content={`Subject: ${outputs.emailSubject}\n\n${outputs.emailBody}`}
                copyText={`Subject: ${outputs.emailSubject}\n\n${outputs.emailBody}`}
                copied={copiedKey === 'email'} onCopy={() => copy(`Subject: ${outputs.emailSubject}\n\n${outputs.emailBody}`, 'email')} />
              <p className="text-xs text-gray-400 text-center pt-1">
                Review all AI-generated copy before publishing. Verify every fact is accurate.
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── History ── */}
      {history.length > 0 && (
        <div className="mt-12">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recent listings</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {history.map((item, i) => (
              <HistoryRow
                key={item.id}
                item={item}
                index={i}
                expanded={expandedId === item.id}
                onExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
