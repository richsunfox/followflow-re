import { createClient } from '@/lib/supabase/server';
import LeadsTable from '@/components/LeadsTable';
import AddLeadModal from '@/components/AddLeadModal';
import ResponseTimeWidget from '@/components/ResponseTimeWidget';

export const dynamic = 'force-dynamic';

// ─── Date helpers ─────────────────────────────────────────────────────────────

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LeadsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Leads query
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, first_name, last_name, email, phone, lead_type, status, priority, source, notes, budget_min, budget_max, last_contacted_at, next_follow_up_at, created_at, sequence_day, sequence_paused, sequence_completed')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Failed to load leads: {error.message}
        </div>
      </div>
    );
  }

  const all = leads ?? [];

  // Quick stats
  const hot       = all.filter(l => l.status === 'hot').length;
  const warm      = all.filter(l => l.status === 'warm').length;
  const nurturing = all.filter(l => l.status === 'nurturing').length;
  const overdue   = all.filter(l => l.next_follow_up_at && new Date(l.next_follow_up_at) < new Date()).length;

  // ─── Response time analytics ──────────────────────────────────────────────

  const now          = new Date();
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd  = new Date(thisWeekStart);
  const monthStart   = startOfMonth(now);

  // Fetch first outbound message per lead (needed for response time calculation).
  // We join with leads to get lead.created_at alongside message.sent_at.
  const { data: messages } = await supabase
    .from('messages')
    .select('lead_id, sent_at, created_at, channel')
    .eq('agent_id', user!.id)
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: true });

  // Build a map of lead_id → first message sent_at
  const firstMessageAt = new Map<string, Date>();
  for (const msg of messages ?? []) {
    if (!firstMessageAt.has(msg.lead_id)) {
      firstMessageAt.set(msg.lead_id, new Date(msg.sent_at));
    }
  }

  // Build lead created_at map from the leads we already fetched
  const leadCreatedAt = new Map<string, Date>();
  for (const lead of all) {
    leadCreatedAt.set(lead.id, new Date(lead.created_at));
  }

  // Response time = minutes between lead.created_at and first message.sent_at
  function responseMinutes(leadId: string): number | null {
    const firstMsg  = firstMessageAt.get(leadId);
    const leadStart = leadCreatedAt.get(leadId);
    if (!firstMsg || !leadStart) return null;
    return (firstMsg.getTime() - leadStart.getTime()) / 60_000;
  }

  function avgResponseForLeads(leadIds: string[]): number | null {
    const times = leadIds.map(responseMinutes).filter((t): t is number => t !== null && t >= 0);
    if (times.length === 0) return null;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  // Leads this week vs last week (by created_at)
  const thisWeekLeads = all.filter(l => new Date(l.created_at) >= thisWeekStart).map(l => l.id);
  const lastWeekLeads = all.filter(l => {
    const d = new Date(l.created_at);
    return d >= lastWeekStart && d < lastWeekEnd;
  }).map(l => l.id);

  // Leads this month
  const monthLeads = all.filter(l => new Date(l.created_at) >= monthStart);
  const monthLeadIds = monthLeads.map(l => l.id);

  // "Responded to" = leads that have at least one sent message
  const respondedIds = monthLeadIds.filter(id => firstMessageAt.has(id));

  // "Within 5 minutes" = response time ≤ 5 min
  const within5m = respondedIds.filter(id => {
    const t = responseMinutes(id);
    return t !== null && t <= 5;
  });

  const stats = {
    avgThisWeek:        avgResponseForLeads(thisWeekLeads),
    avgLastWeek:        avgResponseForLeads(lastWeekLeads),
    leadsThisMonth:     monthLeads.length,
    respondedThisMonth: respondedIds.length,
    respondedWithin5m:  within5m.length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-500 text-sm mt-1">
              {all.length} total lead{all.length !== 1 ? 's' : ''} in your pipeline
            </p>
          </div>
          <AddLeadModal />
        </div>

        {/* Response time widget — primary value proof */}
        <div className="mt-6">
          <ResponseTimeWidget stats={stats} />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <StatCard label="Hot leads"    value={hot}       color="text-red-600"    bg="bg-red-50"    border="border-red-100" />
          <StatCard label="Warm leads"   value={warm}      color="text-orange-600" bg="bg-orange-50" border="border-orange-100" />
          <StatCard label="Nurturing"    value={nurturing} color="text-blue-600"   bg="bg-blue-50"   border="border-blue-100" />
          <StatCard label="Overdue"      value={overdue}   color="text-rose-600"   bg="bg-rose-50"   border="border-rose-100" />
        </div>
      </div>

      {/* Table */}
      <LeadsTable leads={all} />
    </div>
  );
}

function StatCard({
  label, value, color, bg, border,
}: {
  label: string; value: number; color: string; bg: string; border: string;
}) {
  return (
    <div className={`${bg} ${border} border rounded-xl px-4 py-4`}>
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
