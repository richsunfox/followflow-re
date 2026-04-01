// ─── SMS Delivery — Twilio ────────────────────────────────────────────────────
// Picks up pending SMS messages from the messages table and sends them
// via Twilio. Updates each row with the delivery status and Twilio SID.

import twilio from 'twilio';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { supabaseAdmin } from '../database/client';

// ─── Env validation ───────────────────────────────────────────────────────────

const accountSid    = process.env.TWILIO_ACCOUNT_SID;
const authToken     = process.env.TWILIO_AUTH_TOKEN;
const fromNumber    = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid)  throw new Error('Missing env: TWILIO_ACCOUNT_SID');
if (!authToken)   throw new Error('Missing env: TWILIO_AUTH_TOKEN');
if (!fromNumber)  throw new Error('Missing env: TWILIO_PHONE_NUMBER');

const twilioClient = twilio(accountSid, authToken);

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingSMSRow {
  id: string;
  agent_id: string;
  lead_id: string;
  body: string;
  leads: {
    first_name: string;
    last_name: string;
    phone: string | null;
  };
}

interface SMSSendResult {
  messageId: string;
  status: 'sent' | 'failed';
  twilioSid?: string;
  error?: string;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Fetches all pending SMS messages from Supabase and sends them via Twilio.
 * Updates each row's status, provider_message_id, and sent_at on completion.
 *
 * Call this from the worker scheduler or a dedicated delivery cron.
 */
export async function sendPendingSMSMessages(batchSize = 50): Promise<SMSSendResult[]> {
  const pending = await fetchPendingSMS(batchSize);

  if (pending.length === 0) {
    log('info', 'No pending SMS messages');
    return [];
  }

  log('info', `Sending ${pending.length} pending SMS message(s)`);

  const results: SMSSendResult[] = [];

  for (const message of pending) {
    const result = await sendOne(message);
    results.push(result);
    await updateMessageStatus(result);
    // Brief pause to stay well within Twilio rate limits (1 msg/sec per number)
    await sleep(1100);
  }

  const sent   = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;
  log('info', `SMS delivery complete — ${sent} sent, ${failed} failed`);

  return results;
}

/**
 * Sends a single SMS message immediately. Useful for real-time sends
 * (e.g., triggered by an agent from the dashboard).
 */
export async function sendSMS(
  to: string,
  body: string,
  messageId?: string,
): Promise<SMSSendResult> {
  const id = messageId ?? 'ad-hoc';
  try {
    const msg = await twilioClient.messages.create({
      to: normalizePhone(to),
      from: fromNumber!,
      body,
    });

    log('info', `SMS sent to ${to} — SID: ${msg.sid}`);
    return { messageId: id, status: 'sent', twilioSid: msg.sid };
  } catch (err) {
    const error = extractError(err);
    log('error', `SMS failed to ${to}: ${error}`);
    return { messageId: id, status: 'failed', error };
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function fetchPendingSMS(limit: number): Promise<PendingSMSRow[]> {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select(`
      id, agent_id, lead_id, body,
      leads (first_name, last_name, phone)
    `)
    .eq('status', 'pending')
    .eq('channel', 'sms')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch pending SMS: ${error.message}`);
  return (data ?? []) as unknown as PendingSMSRow[];
}

async function sendOne(message: PendingSMSRow): Promise<SMSSendResult> {
  const { id, leads } = message;

  if (!leads?.phone) {
    log('warn', `Lead has no phone number — skipping message ${id}`);
    return { messageId: id, status: 'failed', error: 'Lead has no phone number' };
  }

  return sendSMS(leads.phone, message.body, id);
}

async function updateMessageStatus(result: SMSSendResult): Promise<void> {
  const update =
    result.status === 'sent'
      ? {
          status: 'sent' as const,
          provider_message_id: result.twilioSid ?? null,
          sent_at: new Date().toISOString(),
          error_message: null,
        }
      : {
          status: 'failed' as const,
          error_message: result.error ?? 'Unknown error',
        };

  const { error } = await supabaseAdmin
    .from('messages')
    .update(update)
    .eq('id', result.messageId);

  if (error) {
    log('error', `Failed to update message ${result.messageId}: ${error.message}`);
  }
}

function normalizePhone(phone: string): string {
  // Ensure E.164 format (+1XXXXXXXXXX for US numbers)
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return phone; // pass through if already formatted or international
}

function extractError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function log(level: 'info' | 'warn' | 'error', message: string): void {
  const ts = new Date().toISOString();
  const fn = level === 'info' ? console.log : level === 'warn' ? console.warn : console.error;
  fn(`[${ts}] [sms] [${level.toUpperCase()}] ${message}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
