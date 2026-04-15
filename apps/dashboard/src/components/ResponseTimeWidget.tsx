// Response time analytics widget — server component
// Data is passed in from the leads page server component

interface ResponseTimeStats {
  avgThisWeek:        number | null;  // minutes
  avgLastWeek:        number | null;  // minutes
  leadsThisMonth:     number;
  respondedThisMonth: number;
  respondedWithin5m:  number;         // count
}

export default function ResponseTimeWidget({ stats }: { stats: ResponseTimeStats }) {
  const { avgThisWeek, avgLastWeek, leadsThisMonth, respondedThisMonth, respondedWithin5m } = stats;

  const pct5m = respondedThisMonth > 0
    ? Math.round((respondedWithin5m / respondedThisMonth) * 100)
    : 0;

  const responseRatePct = leadsThisMonth > 0
    ? Math.round((respondedThisMonth / leadsThisMonth) * 100)
    : 0;

  // Week-over-week direction
  let wowLabel  = '';
  let wowColor  = 'text-gray-400';
  let wowArrow  = null as React.ReactNode;

  if (avgThisWeek !== null && avgLastWeek !== null && avgLastWeek > 0) {
    const delta = ((avgLastWeek - avgThisWeek) / avgLastWeek) * 100;
    if (delta > 1) {
      wowLabel = `${Math.round(delta)}% faster than last week`;
      wowColor = 'text-emerald-600';
      wowArrow = (
        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
        </svg>
      );
    } else if (delta < -1) {
      wowLabel = `${Math.round(Math.abs(delta))}% slower than last week`;
      wowColor = 'text-rose-600';
      wowArrow = (
        <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
        </svg>
      );
    } else {
      wowLabel = 'Same as last week';
      wowColor = 'text-gray-400';
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
          <svg className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">Response Time</h2>
          <p className="text-xs text-gray-500">Your core value metric</p>
        </div>
      </div>

      {/* Primary metric */}
      <div className="mb-5">
        <div className="flex items-end gap-2">
          <span className="text-4xl font-black text-indigo-700 tabular-nums leading-none">
            {avgThisWeek !== null ? formatMinutes(avgThisWeek) : '—'}
          </span>
          <span className="text-sm text-indigo-400 pb-1 font-medium">avg this week</span>
        </div>
        {wowLabel && (
          <div className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${wowColor}`}>
            {wowArrow}
            {wowLabel}
            {avgLastWeek !== null && (
              <span className="text-gray-400 font-normal ml-1">(last week: {formatMinutes(avgLastWeek)})</span>
            )}
          </div>
        )}
        {avgThisWeek === null && (
          <p className="text-xs text-gray-400 mt-1">No outbound messages sent this week yet.</p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-indigo-100 mb-5" />

      {/* Supporting stats grid */}
      <div className="grid grid-cols-3 gap-4">
        <StatCell
          label="Leads this month"
          value={leadsThisMonth.toString()}
          sub={null}
        />
        <StatCell
          label="Responded to"
          value={respondedThisMonth.toString()}
          sub={leadsThisMonth > 0 ? `${responseRatePct}% of leads` : null}
        />
        <StatCell
          label="Within 5 min"
          value={`${pct5m}%`}
          sub={respondedThisMonth > 0 ? `${respondedWithin5m} of ${respondedThisMonth}` : null}
          highlight={pct5m >= 50}
        />
      </div>

      {/* Nudge */}
      <p className="mt-4 text-xs text-indigo-500 leading-relaxed">
        Leads contacted within 5 minutes are <strong>9× more likely to convert</strong>. Always On fires the first message automatically.
      </p>
    </div>
  );
}

function StatCell({
  label, value, sub, highlight = false,
}: {
  label: string; value: string; sub: string | null; highlight?: boolean;
}) {
  return (
    <div>
      <div className={`text-xl font-black tabular-nums leading-none ${highlight ? 'text-emerald-600' : 'text-gray-800'}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function formatMinutes(minutes: number): string {
  if (minutes < 1)   return '<1 min';
  if (minutes < 60)  return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
