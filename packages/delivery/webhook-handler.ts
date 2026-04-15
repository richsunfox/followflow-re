// ─── Inbound Webhook Handler ──────────────────────────────────────────────────
// Handles inbound replies from leads via Twilio (SMS) and SendGrid (email).
// Saves them to the inbound_messages table and attempts to match each
// message to an existing lead by phone or email.
//
// This module is framework-agnostic — it exports pure handler functions
// that return { status, body }. Wire them into Express, Next.js API routes,
// or any other HTTP framework.
//
// Webhook URLs to configure:
//   Twilio:   POST /webhooks/twilio/inbound
//   SendGrid: POST /webhooks/sendgrid/inbound  (via Inbound Parse)

import { validateRequest as twilioValidateRequest } from 'twilio';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { supabaseAdmin } from '../database/client';

// ─── Env ──────────────────────────────────────────────────────────────────────

const twilioAuthToken   = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface WebhookResponse {
  status: number;
  body: string;
  headers?: Record<string, string>;
}

// ─── Twilio inbound SMS ───────────────────────────────────────────────────────

export interface TwilioInboundPayload {
  MessageSid:   string;
  From:         string;   // sender's phone — the lead
  To:           string;   // our Twilio number — the agent
  Body:         string;
  NumMedia?:    string;
  MediaUrl0?:   string;
}

/**
 * Handles an inbound SMS from Twilio.
 *
 * @param payload  - Parsed form body from Twilio's POST request
 * @param signature - Value of the `X-Twilio-Signature` header
 * @param requestUrl - Full URL of the webhook endpoint (must match exactly)
 *
 * Returns a TwiML response so Twilio doesn't retry.
 */
export async function handleTwilioInbound(
  payload: TwilioInboundPayload,
  signature: string,
  requestUrl: string,
): Promise<WebhookResponse> {
  // ── Signature validation ──────────────────────────────────────────────────
  // Skip in development if TWILIO_AUTH_TOKEN is not set
  if (twilioAuthToken) {
    const isValid = twilioValidateRequest(
      twilioAuthToken,
      signature,
      requestUrl,
      payload as unknown as Record<string, string>,
    );
    if (!isValid) {
      log('warn', `Invalid Twilio signature — request rejected (${requestUrl})`);
      return { status: 403, body: 'Forbidden' };
    }
  } else {
    log('warn', 'TWILIO_AUTH_TOKEN not set — skipping signature validation');
  }

  const fromPhone  = normalizePhone(payload.From);
  const toPhone    = normalizePhone(payload.To);
  const body       = payload.Body?.trim() ?? '';

  log('info', `Inbound SMS from ${fromPhone} → ${toPhone}: "${body.substring(0, 60)}"`);

  try {
    // Find agent by their Twilio number
    const agent = await findAgentByPhone(toPhone);
    if (!agent) {
      log('warn', `No agent found for Twilio number ${toPhone}`);
      return twimlResponse(''); // Acknowledge but don't error
    }

    // Try to match sender to an existing lead
    const lead = await findLeadByPhone(fromPhone, agent.id);

    // Save to inbound_messages
    await supabaseAdmin.from('inbound_messages').insert({
      agent_id:   agent.id,
      lead_id:    lead?.id ?? null,
      channel:    'sms',
      from_phone: fromPhone,
      body,
      is_read:    false,
      received_at: new Date().toISOString(),
    });

    if (lead) {
      log('info', `Matched to lead: ${lead.first_name} ${lead.last_name} (${lead.id})`);
      // Update lead's last_contacted_at — they reached out, sequence should pause
      await supabaseAdmin
        .from('leads')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', lead.id);
    } else {
      log('info', `No lead match for ${fromPhone} — saved as unmatched inbound`);
    }

    // Respond with empty TwiML — no auto-reply (agent handles it manually)
    return twimlResponse('');
  } catch (err) {
    log('error', `Error handling Twilio inbound: ${extractError(err)}`);
    // Still return 200 to prevent Twilio retries
    return twimlResponse('');
  }
}

// ─── SendGrid inbound email (Inbound Parse) ───────────────────────────────────

export interface SendGridInboundPayload {
  from:     string;    // e.g. "Jane Doe <jane@example.com>"
  to:       string;    // e.g. "agent@alwayson.ai"
  subject?: string;
  text?:    string;    // plain text body
  html?:    string;    // HTML body (fallback)
  envelope?: string;   // JSON string with {from, to}
}

/**
 * Handles an inbound email from SendGrid's Inbound Parse webhook.
 * Configure in SendGrid: Settings → Inbound Parse → Add Host & URL
 *
 * @param payload - Parsed form body from SendGrid's POST request
 */
export async function handleSendGridInbound(
  payload: SendGridInboundPayload,
): Promise<WebhookResponse> {
  const fromRaw   = payload.from ?? '';
  const toRaw     = payload.to ?? '';
  const subject   = payload.subject?.trim() ?? '(no subject)';
  const body      = extractEmailBody(payload.text, payload.html);

  const fromEmail = extractEmailAddress(fromRaw);
  const toEmail   = extractEmailAddress(toRaw);

  log('info', `Inbound email from ${fromEmail} → ${toEmail}: "${subject}"`);

  if (!fromEmail || !toEmail) {
    log('warn', 'Could not parse from/to email addresses — discarding');
    return { status: 400, body: 'Bad Request' };
  }

  try {
    // Find agent by their email address
    const agent = await findAgentByEmail(toEmail);
    if (!agent) {
      log('warn', `No agent found for email ${toEmail}`);
      return { status: 200, body: 'OK' };
    }

    // Try to match sender to an existing lead
    const lead = await findLeadByEmail(fromEmail, agent.id);

    // Save to inbound_messages
    await supabaseAdmin.from('inbound_messages').insert({
      agent_id:    agent.id,
      lead_id:     lead?.id ?? null,
      channel:     'email',
      from_email:  fromEmail,
      subject,
      body,
      is_read:     false,
      received_at: new Date().toISOString(),
    });

    if (lead) {
      log('info', `Matched to lead: ${lead.first_name} ${lead.last_name} (${lead.id})`);
      await supabaseAdmin
        .from('leads')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', lead.id);
    } else {
      log('info', `No lead match for ${fromEmail} — saved as unmatched inbound`);
    }

    return { status: 200, body: 'OK' };
  } catch (err) {
    log('error', `Error handling SendGrid inbound: ${extractError(err)}`);
    return { status: 200, body: 'OK' }; // Return 200 to prevent SendGrid retries
  }
}

// ─── Supabase lookups ─────────────────────────────────────────────────────────

async function findAgentByPhone(phone: string): Promise<{ id: string } | null> {
  const { data } = await supabaseAdmin
    .from('agents')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();
  return data;
}

async function findAgentByEmail(email: string): Promise<{ id: string } | null> {
  const { data } = await supabaseAdmin
    .from('agents')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  return data;
}

async function findLeadByPhone(
  phone: string,
  agentId: string,
): Promise<{ id: string; first_name: string; last_name: string } | null> {
  // Try exact match first, then normalized digits-only match
  const { data } = await supabaseAdmin
    .from('leads')
    .select('id, first_name, last_name')
    .eq('agent_id', agentId)
    .eq('phone', phone)
    .maybeSingle();

  if (data) return data;

  // Fallback: strip formatting and try again
  const digits = phone.replace(/\D/g, '').slice(-10);
  const { data: fallback } = await supabaseAdmin
    .from('leads')
    .select('id, first_name, last_name')
    .eq('agent_id', agentId)
    .ilike('phone', `%${digits}`)
    .maybeSingle();

  return fallback;
}

async function findLeadByEmail(
  email: string,
  agentId: string,
): Promise<{ id: string; first_name: string; last_name: string } | null> {
  const { data } = await supabaseAdmin
    .from('leads')
    .select('id, first_name, last_name')
    .eq('agent_id', agentId)
    .eq('email', email.toLowerCase())
    .maybeSingle();
  return data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds a TwiML response. Pass an empty string for no auto-reply.
 */
function twimlResponse(replyBody: string): WebhookResponse {
  const twiml = replyBody
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(replyBody)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

  return {
    status: 200,
    body: twiml,
    headers: { 'Content-Type': 'text/xml' },
  };
}

/**
 * Extracts plain text from an email body.
 * Prefers the text part; strips basic HTML tags from the HTML part as fallback.
 */
function extractEmailBody(text?: string, html?: string): string {
  if (text?.trim()) return text.trim();
  if (html?.trim()) {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  return '';
}

/**
 * Extracts the email address from a formatted string like "Name <email@example.com>"
 * or a bare "email@example.com".
 */
function extractEmailAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  if (match) return match[1].trim().toLowerCase();
  const bare = raw.split(',')[0].trim().toLowerCase();
  return bare.includes('@') ? bare : '';
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return phone;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function extractError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function log(level: 'info' | 'warn' | 'error', message: string): void {
  const ts = new Date().toISOString();
  const fn = level === 'info' ? console.log : level === 'warn' ? console.warn : console.error;
  fn(`[${ts}] [webhook] [${level.toUpperCase()}] ${message}`);
}
