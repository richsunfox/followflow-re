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
        <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
        <p className="text-gray-500 text-sm mt-1">Everything the AI has done in the last 30 days</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <StatCard label="Sent"         value={sent}          color="text-green-600"  bg="bg-green-50"  border="border-green-100" />
          <StatCard label="Pending"      value={pending}       color="text-yellow-600" bg="bg-yellow-50" border="border-yellow-100" />
          <StatCard label="Failed"       value={failed}        color="text-red-600"    bg="bg-red-50"    border="border-red-100" />
          <StatCard label="Replies in"   value={replies.length} color="text-indigo-600" bg="bg-indigo-50" border="border-indigo-100" />
        </div>
      </div>

      <ActivityList feed={feed} />
    </div>
  );
}

function StatCard({ label, value, color, bg, border }: {
  label: string; value: number; color: string; bg: string; border: string;
}) {
  return (
    <div className={`${bg} ${border} border rounded-xl px-4 py-4`}>
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
