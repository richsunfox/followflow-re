import { createClient } from '@/lib/supabase/server';
import ActivityList, { type ActivityItem } from '@/components/ActivityList';

export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
  const supabase = createClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Outbound messages (and any logged inbound with direction column)
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select(`
      id, channel, direction, subject, body, status,
      ai_generated, sent_at, created_at,
      leads (id, first_name, last_name)
    `)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(300);

  // Inbound replies from the dedicated inbound_messages table
  const { data: inbound, error: inboundError } = await supabase
    .from('inbound_messages')
    .select(`
      id, channel, from_phone, from_email, subject, body,
      is_read, received_at, created_at,
      leads (id, first_name, last_name)
    `)
    .gte('created_at', thirtyDaysAgo)
    .order('received_at', { ascending: false })
    .limit(100);

  if (msgError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Failed to load activity: {msgError.message}
        </div>
      </div>
    );
  }

  // ── Unify into a single ActivityItem[] ─────────────────────────────────────

  const feed: ActivityItem[] = [];

  for (const m of messages ?? []) {
    const lead = m.leads as unknown as { id: string; first_name: string; last_name: string } | null;
    feed.push({
      id:          m.id,
      direction:   (m.direction as 'outbound' | 'inbound') ?? 'outbound',
      channel:     m.channel as 'sms' | 'email',
      leadName:    lead ? `${lead.first_name} ${lead.last_name}` : 'Unknown lead',
      leadId:      lead?.id ?? null,
      subject:     m.subject ?? null,
      body:        m.body,
      status:      m.status,
      ai_generated: m.ai_generated,
      timestamp:   m.sent_at ?? m.created_at,
    });
  }

  // Add inbound_messages entries not already present in messages table
  const existingIds = new Set(feed.map(f => f.id));
  for (const im of inbound ?? []) {
    if (existingIds.has(im.id)) continue;  // avoid duplicates if logged to both tables
    const lead = im.leads as unknown as { id: string; first_name: string; last_name: string } | null;
    feed.push({
      id:          im.id,
      direction:   'inbound',
      channel:     im.channel as 'sms' | 'email',
      leadName:    lead ? `${lead.first_name} ${lead.last_name}` : 'Unknown lead',
      leadId:      lead?.id ?? null,
      subject:     im.subject ?? null,
      body:        im.body,
      status:      'received',
      ai_generated: false,
      timestamp:   im.received_at,
    });
  }

  // Sort unified feed by timestamp descending
  feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // ── Stats ──────────────────────────────────────────────────────────────────

  const outbound  = feed.filter(f => f.direction === 'outbound');
  const replies   = feed.filter(f => f.direction === 'inbound');
  const sent      = outbound.filter(f => ['sent', 'delivered'].includes(f.status)).length;
  const pending   = outbound.filter(f => f.status === 'pending').length;
  const failed    = outbound.filter(f => ['failed', 'bounced'].includes(f.status)).length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0F1629]">Activity Feed</h1>
            <p className="text-slate-500 text-sm mt-1">Everything the AI has done in the last 30 days</p>
          </div>

          {/* Sequence goal reminder */}
          <div className="shrink-0 flex items-center gap-2.5 bg-[#3B7BFF]/10 border border-[#3B7BFF]/25 rounded-xl px-4 py-3">
            <div className="w-7 h-7 bg-[#3B7BFF] rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
            </div>
            <div>
              <div className="text-[#3B7BFF] text-xs font-semibold uppercase tracking-wide leading-none">Sequence goal</div>
              <div className="text-[#0F1629] text-sm font-semibold mt-0.5 leading-tight">Get them on the phone</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <StatCard label="Sent"       value={sent}           accent="#22C55E" />
          <StatCard label="Pending"    value={pending}        accent="#F59E0B" />
          <StatCard label="Failed"     value={failed}         accent="#EF4444" />
          <StatCard label="Replies in" value={replies.length} accent="#3B7BFF" />
        </div>
      </div>

      <ActivityList feed={feed} />
    </div>
  );
}

function StatCard({ label, value, accent }: {
  label: string; value: number; accent: string;
}) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-4 shadow-sm">
      <div className="text-2xl font-bold tabular-nums leading-none" style={{ color: accent }}>{value}</div>
      <div className="text-xs text-slate-500 font-medium mt-1.5">{label}</div>
    </div>
  );
}
