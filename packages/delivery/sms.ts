// ─── SMS Delivery — Twilio ────────────────────────────────────────────────────
// Sends SMS messages via Twilio using Always On's shared Twilio account.
// TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN come from environment variables.
// Each agent has their own dedicated fromNumber (twilio_phone_number column).

import twilio from 'twilio';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { supabaseAdmin } from '../database/client';

// ─── Twilio client (shared account) ──────────────────────────────────────────

function getClient() {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in environment');
  return twilio(sid, token);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingSMSRow {
  id: string;
  agent_id: string;
  lead_id: string;
  body: string;
  leads: {
    first_name: string;
    last_name:  string;
    phone:      string | null;
  };
}

export interface SMSSendResult {
  messageId:  string;
  status:     'sent' | 'failed';
  twilioSid?: string;
  error?:     string;
}

// ─── Main exports ─────────────────────────────────────────────────────────────

/**
 * Sends a single SMS message immediately.
 * fromNumber is the agent's dedicated Twilio number (from agents.twilio_phone_number).
 */
export async function sendSMS(
  to:          string,
  body:        string,
  fromNumber:  string,
  messageId?:  string,
): Promise<SMSSendResult> {
  const id     = messageId ?? 'ad-hoc';
  const client = getClient();

  try {
    const msg = await client.messages.create({
      to:   normalizePhone(to),
      from: fromNumber,
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

/**
 * Fetches all pending SMS messages for one agent and sends them.
 * Useful for retrying failed messages or as a manual delivery trigger.
 */
export async function sendPendingSMSMessages(
  agentId:    string,
  fromNumber: string,
  batchSize = 50,
): Promise<SMSSendResult[]> {
  const pending = await fetchPendingSMS(agentId, batchSize);

  if (pending.length === 0) {
    log('info', `No pending SMS messages for agent ${agentId}`);
    return [];
  }

  log('info', `Sending ${pending.length} pending SMS message(s) for agent ${agentId}`);

  const results: SMSSendResult[] = [];

  for (const message of pending) {
    const result = await sendOneFromQueue(message, fromNumber);
    results.push(result);
    await updateMessageStatus(result);
    // Brief pause — Twilio recommends ≤1 msg/sec per number
    await sleep(1100);
  }

  const sent   = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;
  log('info', `SMS delivery complete — ${sent} sent, ${failed} failed`);

  return results;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function fetchPendingSMS(agentId: string, limit: number): Promise<PendingSMSRow[]> {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select(`
      id, agent_id, lead_id, body,
      leads (first_name, last_name, phone)
    `)
    .eq('status', 'pending')
    .eq('channel', 'sms')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch pending SMS: ${error.message}`);
  return (data ?? []) as unknown as PendingSMSRow[];
}

async function sendOneFromQueue(
  message:    PendingSMSRow,
  fromNumber: string,
): Promise<SMSSendResult> {
  const { id, leads } = message;

  if (!leads?.phone) {
    log('warn', `Lead has no phone number — skipping message ${id}`);
    return { messageId: id, status: 'failed', error: 'Lead has no phone number' };
  }

  return sendSMS(leads.phone, message.body, fromNumber, id);
}

async function updateMessageStatus(result: SMSSendResult): Promise<void> {
  const update =
    result.status === 'sent'
      ? {
          status:              'sent' as const,
          provider_message_id: result.twilioSid ?? null,
          sent_at:             new Date().toISOString(),
          error_message:       null,
        }
      : {
          status:        'failed' as const,
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
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return phone;
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
