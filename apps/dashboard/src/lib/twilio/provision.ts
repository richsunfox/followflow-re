// ─── Phone number provisioning ────────────────────────────────────────────────
// Called once per agent after onboarding completes.
// Searches for an available US local SMS-capable number, purchases it,
// points its inbound webhook at this app, and writes it to agents.twilio_phone_number.

import twilio from 'twilio';
import { createClient as createAdmin } from '@supabase/supabase-js';

function getClient() {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set');
  return twilio(sid, token);
}

function getAdminClient() {
  return createAdmin(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export interface ProvisionResult {
  phoneNumber?: string;
  error?:       string;
}

/**
 * Provisions a dedicated Twilio phone number for an agent.
 * Safe to call multiple times — skips if the agent already has a number.
 *
 * @param agentId   - The agent's UUID (must match agents.id)
 * @param appUrl    - Base URL of the deployed app, e.g. https://app.followflowre.com
 */
export async function provisionPhoneNumber(
  agentId: string,
  appUrl:  string,
): Promise<ProvisionResult> {
  const supabase = getAdminClient();

  // ── Idempotency check ────────────────────────────────────────────────────────
  const { data: agent, error: fetchError } = await supabase
    .from('agents')
    .select('twilio_phone_number')
    .eq('id', agentId)
    .single();

  if (fetchError) return { error: `Could not fetch agent: ${fetchError.message}` };
  if (agent?.twilio_phone_number) return { phoneNumber: agent.twilio_phone_number };

  // ── Find an available US local number ────────────────────────────────────────
  const client    = getClient();
  const webhookUrl = `${appUrl}/api/webhooks/twilio`;

  let available;
  try {
    available = await client.availablePhoneNumbers('US').local.list({
      smsEnabled: true,
      limit:      1,
    });
  } catch (err) {
    return { error: `Twilio number search failed: ${extractError(err)}` };
  }

  if (available.length === 0) {
    return { error: 'No US local numbers currently available from Twilio' };
  }

  // ── Purchase and configure ───────────────────────────────────────────────────
  let purchased;
  try {
    purchased = await client.incomingPhoneNumbers.create({
      phoneNumber: available[0].phoneNumber,
      smsUrl:      webhookUrl,
      smsMethod:   'POST',
    });
  } catch (err) {
    return { error: `Twilio number purchase failed: ${extractError(err)}` };
  }

  // ── Save to agents table ─────────────────────────────────────────────────────
  const { error: saveError } = await supabase
    .from('agents')
    .update({ twilio_phone_number: purchased.phoneNumber })
    .eq('id', agentId);

  if (saveError) {
    // Release the number so we don't leak a paid resource
    await client.incomingPhoneNumbers(purchased.sid).remove().catch(() => {});
    return { error: `Saved failed, number released: ${saveError.message}` };
  }

  return { phoneNumber: purchased.phoneNumber };
}

function extractError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
