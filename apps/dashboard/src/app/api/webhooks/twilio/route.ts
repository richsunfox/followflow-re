// POST /api/webhooks/twilio
// Receives inbound SMS replies from Twilio.
// Logs the reply, pauses the AI sequence, and notifies the agent by email.

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { validateRequest as twilioValidateRequest } from 'twilio';

// Service role client — needs to update leads + write messages without auth session
const supabase = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// Twilio sends form-encoded POST bodies
export async function POST(request: NextRequest) {
  // Parse URL-encoded body
  const text     = await request.text();
  const params   = new URLSearchParams(text);
  const payload: Record<string, string> = {};
  params.forEach((v, k) => { payload[k] = v; });

  const from       = payload['From'] ?? '';
  const to         = payload['To']   ?? '';
  const body       = payload['Body'] ?? '';

  // ── Signature validation ────────────────────────────────────────────────────
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (authToken) {
    const signature  = request.headers.get('x-twilio-signature') ?? '';
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`;
    const isValid    = twilioValidateRequest(authToken, signature, webhookUrl, payload);
    if (!isValid) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  const fromPhone = normalizePhone(from);
  const toPhone   = normalizePhone(to);

  try {
    // ── Find agent by their Twilio number ─────────────────────────────────────
    const { data: agent } = await supabase
      .from('agents')
      .select('id, email, full_name')
      .eq('phone', toPhone)
      .maybeSingle();

    if (!agent) {
      // No agent matched — acknowledge Twilio and move on
      return twiml('');
    }

    // ── Match sender to a lead ────────────────────────────────────────────────
    const lead = await findLeadByPhone(fromPhone, agent.id);

    // ── Log to messages table (direction = inbound) ───────────────────────────
    await supabase.from('messages').insert({
      agent_id:    agent.id,
      lead_id:     lead?.id ?? null,
      channel:     'sms',
      body,
      direction:   'inbound',
      status:      'delivered',   // inbound messages are already received
      ai_generated: false,
      sent_at:     new Date().toISOString(),
    });

    if (lead) {
      // ── Update lead: status → replied, pause sequence ─────────────────────
      await supabase
        .from('leads')
        .update({
          status:            'replied',
          sequence_paused:   true,
          last_contacted_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      // ── Notify agent via email ─────────────────────────────────────────────
      await notifyAgent({
        agentEmail: agent.email,
        agentName:  agent.full_name,
        leadName:   `${lead.first_name} ${lead.last_name}`,
        leadId:     lead.id,
        replyBody:  body,
      });
    }
  } catch (err) {
    // Log but always return 200 — Twilio will retry on non-2xx
    console.error('[twilio-webhook] Error:', err instanceof Error ? err.message : err);
  }

  return twiml(''); // empty TwiML — no auto-reply
}

// ─── Agent notification email ──────────────────────────────────────────────────

interface NotifyParams {
  agentEmail: string;
  agentName:  string;
  leadName:   string;
  leadId:     string;
  replyBody:  string;
}

async function notifyAgent(p: NotifyParams): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn('[twilio-webhook] SENDGRID_API_KEY not set — skipping agent notification');
    return;
  }

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const leadsUrl = `${appUrl}/leads`;
  const preview  = p.replyBody.length > 200 ? p.replyBody.slice(0, 200) + '…' : p.replyBody;

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1f2937">
      <div style="background:#4f46e5;padding:20px 24px;border-radius:12px 12px 0 0">
        <p style="margin:0;color:#fff;font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase">FollowFlow RE</p>
      </div>
      <div style="background:#fff;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827">
          ${escapeHtml(p.leadName)} just replied
        </h2>
        <p style="margin:0 0 20px;font-size:14px;color:#6b7280">
          Your lead responded to one of your AI follow-up messages. Their sequence has been paused.
        </p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:24px">
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6">"${escapeHtml(preview)}"</p>
        </div>
        <a href="${leadsUrl}" style="display:inline-block;background:#4f46e5;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none">
          View leads →
        </a>
        <p style="margin:20px 0 0;font-size:12px;color:#9ca3af">
          Sequence paused — no more AI messages will send to this lead until you resume it.
        </p>
      </div>
    </div>`;

  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: p.agentEmail, name: p.agentName }] }],
      from:    { email: process.env.SENDGRID_FROM_EMAIL ?? p.agentEmail, name: 'FollowFlow RE' },
      subject: `${p.leadName} just replied to your follow-up`,
      content: [{ type: 'text/html', value: html }],
    }),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function findLeadByPhone(
  phone: string,
  agentId: string,
): Promise<{ id: string; first_name: string; last_name: string } | null> {
  const { data } = await supabase
    .from('leads')
    .select('id, first_name, last_name')
    .eq('agent_id', agentId)
    .eq('phone', phone)
    .maybeSingle();

  if (data) return data;

  // Fallback: match by last 10 digits
  const digits = phone.replace(/\D/g, '').slice(-10);
  const { data: fallback } = await supabase
    .from('leads')
    .select('id, first_name, last_name')
    .eq('agent_id', agentId)
    .ilike('phone', `%${digits}`)
    .maybeSingle();

  return fallback ?? null;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return phone;
}

function twiml(replyBody: string): NextResponse {
  const xml = replyBody
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(replyBody)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}

function escapeXml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
