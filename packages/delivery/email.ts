// ─── Email Delivery — SendGrid ────────────────────────────────────────────────
// Picks up pending email messages from the messages table and sends them
// via SendGrid. Updates each row with delivery status and SendGrid message ID.

import sgMail from '@sendgrid/mail';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { supabaseAdmin } from '../database/client';

// ─── Env validation ───────────────────────────────────────────────────────────

const sendgridApiKey = process.env.SENDGRID_API_KEY;
if (!sendgridApiKey) throw new Error('Missing env: SENDGRID_API_KEY');

sgMail.setApiKey(sendgridApiKey);

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingEmailRow {
  id: string;
  agent_id: string;
  lead_id: string;
  subject: string | null;
  body: string;
  leads: {
    first_name: string;
    last_name: string;
    email: string | null;
  };
  agents: {
    full_name: string;
    email: string;
    brokerage: string | null;
  };
}

interface EmailSendResult {
  messageId: string;
  status: 'sent' | 'failed';
  sendgridMessageId?: string;
  error?: string;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Fetches all pending email messages from Supabase and sends them via SendGrid.
 * Updates each row's status, provider_message_id, and sent_at on completion.
 *
 * NOTE: The agent's email address must be verified as a sender in SendGrid
 * (either as a single sender or via domain authentication) before emails
 * will deliver. See: https://docs.sendgrid.com/ui/sending-email/sender-verification
 */
export async function sendPendingEmails(batchSize = 50): Promise<EmailSendResult[]> {
  const pending = await fetchPendingEmails(batchSize);

  if (pending.length === 0) {
    log('info', 'No pending email messages');
    return [];
  }

  log('info', `Sending ${pending.length} pending email(s)`);

  const results: EmailSendResult[] = [];

  for (const message of pending) {
    const result = await sendOne(message);
    results.push(result);
    await updateMessageStatus(result);
    // Brief pause between sends — SendGrid's free tier allows 100/day,
    // Pro allows much more. Adjust as needed.
    await sleep(200);
  }

  const sent   = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;
  log('info', `Email delivery complete — ${sent} sent, ${failed} failed`);

  return results;
}

/**
 * Sends a single transactional email immediately.
 * Useful for real-time triggered sends from the dashboard.
 */
export async function sendEmail(params: {
  to: string;
  toName?: string;
  from: string;
  fromName: string;
  replyTo?: string;
  subject: string;
  body: string;
  messageId?: string;
}): Promise<EmailSendResult> {
  const id = params.messageId ?? 'ad-hoc';

  try {
    const [response] = await sgMail.send({
      to: { email: params.to, name: params.toName ?? '' },
      from: { email: params.from, name: params.fromName },
      replyTo: params.replyTo ?? params.from,
      subject: params.subject,
      // Send both text and a minimal HTML version for better deliverability
      text: params.body,
      html: bodyToHtml(params.body),
    });

    const sgMessageId = response.headers['x-message-id'] as string | undefined;
    log('info', `Email sent to ${params.to} — SG ID: ${sgMessageId}`);
    return { messageId: id, status: 'sent', sendgridMessageId: sgMessageId };
  } catch (err) {
    const error = extractError(err);
    log('error', `Email failed to ${params.to}: ${error}`);
    return { messageId: id, status: 'failed', error };
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function fetchPendingEmails(limit: number): Promise<PendingEmailRow[]> {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select(`
      id, agent_id, lead_id, subject, body,
      leads (first_name, last_name, email),
      agents (full_name, email, brokerage)
    `)
    .eq('status', 'pending')
    .eq('channel', 'email')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch pending emails: ${error.message}`);
  return (data ?? []) as unknown as PendingEmailRow[];
}

async function sendOne(message: PendingEmailRow): Promise<EmailSendResult> {
  const { id, leads, agents } = message;

  if (!leads?.email) {
    log('warn', `Lead has no email address — skipping message ${id}`);
    return { messageId: id, status: 'failed', error: 'Lead has no email address' };
  }

  const subject = message.subject ?? buildFallbackSubject(agents.full_name, leads.first_name);

  return sendEmail({
    to: leads.email,
    toName: `${leads.first_name} ${leads.last_name}`,
    from: agents.email,
    fromName: agents.full_name,
    replyTo: agents.email,
    subject,
    body: message.body,
    messageId: id,
  });
}

async function updateMessageStatus(result: EmailSendResult): Promise<void> {
  const update =
    result.status === 'sent'
      ? {
          status: 'sent' as const,
          provider_message_id: result.sendgridMessageId ?? null,
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

/**
 * Converts plain text to basic HTML for better email client rendering.
 * Preserves paragraph breaks and wraps in a clean, readable layout.
 */
function bodyToHtml(text: string): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 16px;line-height:1.6;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;color:#1a1a1a;max-width:600px;margin:0 auto;padding:32px 24px;">
${paragraphs}
</body>
</html>`;
}

function buildFallbackSubject(agentName: string, leadFirstName: string): string {
  return `A note from ${agentName.split(' ')[0]} — for ${leadFirstName}`;
}

function extractError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function log(level: 'info' | 'warn' | 'error', message: string): void {
  const ts = new Date().toISOString();
  const fn = level === 'info' ? console.log : level === 'warn' ? console.warn : console.error;
  fn(`[${ts}] [email] [${level.toUpperCase()}] ${message}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
