import { createClient } from '@/lib/supabase/server';
import InboxView, { type ConversationThread, type InboxMessage } from '@/components/InboxView';

export const dynamic = 'force-dynamic';

type LeadJoin = {
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  status: string;
  sequence_paused: boolean;
};

export default async function InboxPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rows, error } = await supabase
    .from('inbound_messages')
    .select(`
      id, lead_id, channel, from_phone, from_email,
      subject, body, is_read, received_at,
      leads (first_name, last_name, phone, email, status, sequence_paused)
    `)
    .eq('agent_id', user!.id)
    .order('received_at', { ascending: false })
    .limit(50);

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Failed to load inbox: {error.message}
        </div>
      </div>
    );
  }

  // ── Group messages into conversation threads ──────────────────────────────
  const threadMap = new Map<string, ConversationThread>();

  for (const row of rows ?? []) {
    // Supabase returns joined record as object or array — normalise to object
    const lead = Array.isArray(row.leads)
      ? (row.leads[0] as LeadJoin | undefined) ?? null
      : (row.leads as LeadJoin | null);

    // Thread key: prefer lead_id, then phone, then email, then message id
    const key = row.lead_id ?? row.from_phone ?? row.from_email ?? row.id;

    const msg: InboxMessage = {
      id:         row.id,
      leadId:     row.lead_id,
      channel:    row.channel as 'sms' | 'email',
      fromPhone:  row.from_phone,
      fromEmail:  row.from_email,
      subject:    row.subject,
      body:       row.body,
      isRead:     row.is_read,
      receivedAt: row.received_at,
    };

    if (!threadMap.has(key)) {
      threadMap.set(key, {
        threadKey:      key,
        leadId:         row.lead_id,
        leadFirstName:  lead?.first_name ?? 'Unknown',
        leadLastName:   lead?.last_name  ?? '',
        leadPhone:      lead?.phone      ?? row.from_phone ?? null,
        leadEmail:      lead?.email      ?? row.from_email ?? null,
        leadStatus:     lead?.status     ?? 'unknown',
        sequencePaused: lead?.sequence_paused ?? false,
        messages:       [],
        latestMessage:  msg,
        hasUnread:      false,
        unreadCount:    0,
      });
    }

    const thread = threadMap.get(key)!;
    thread.messages.push(msg);
    if (!msg.isRead) {
      thread.hasUnread   = true;
      thread.unreadCount += 1;
    }
  }

  // Sort: unread threads first, then by most-recent message
  const threads = Array.from(threadMap.values()).sort((a, b) => {
    if (a.hasUnread !== b.hasUnread) return a.hasUnread ? -1 : 1;
    return (
      new Date(b.latestMessage.receivedAt).getTime() -
      new Date(a.latestMessage.receivedAt).getTime()
    );
  });

  const totalUnread = threads.reduce((n, t) => n + t.unreadCount, 0);

  return <InboxView threads={threads} totalUnread={totalUnread} />;
}
