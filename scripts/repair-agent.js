#!/usr/bin/env node
// ─── One-off: create missing agents row + provision Twilio number ──────────────
// Run from the repo root: node scripts/repair-agent.js
// Safe to re-run — skips steps that are already complete.

require('dotenv').config({ path: require('path').resolve(__dirname, '../apps/dashboard/.env.local') });

const twilio  = require('twilio');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

async function run() {

  // ── 1. Fetch all auth users ────────────────────────────────────────────────
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) { console.error('Failed to list auth users:', authErr.message); process.exit(1); }
  if (!users.length) { console.log('No auth users found.'); return; }

  // ── 2. Fetch existing agent rows ───────────────────────────────────────────
  const { data: agents, error: agentsErr } = await supabase
    .from('agents')
    .select('id, full_name, email, twilio_phone_number');
  if (agentsErr) { console.error('Failed to fetch agents:', agentsErr.message); process.exit(1); }

  const agentIds = new Set((agents ?? []).map(a => a.id));

  // ── 3. Insert missing agent rows ───────────────────────────────────────────
  const missing = users.filter(u => !agentIds.has(u.id));

  for (const user of missing) {
    console.log(`Creating agents row for ${user.email}…`);
    const { error } = await supabase.from('agents').insert({
      id:        user.id,
      email:     user.email,
      full_name: user.user_metadata?.full_name ?? user.email.split('@')[0],
    });
    if (error && !error.message.includes('duplicate')) {
      console.error(`  ✗ Insert failed: ${error.message}`);
    } else {
      console.log(`  ✓ Agent row created`);
      // Add to our local list for the provisioning step below
      agents.push({ id: user.id, email: user.email, full_name: user.email, twilio_phone_number: null });
    }
  }

  // ── 4. Re-fetch to get fresh list including any we just inserted ───────────
  const { data: allAgents } = await supabase
    .from('agents')
    .select('id, full_name, email, twilio_phone_number');

  const needsNumber = (allAgents ?? []).filter(a => !a.twilio_phone_number);

  if (!needsNumber.length) {
    console.log('\nAll agents already have a Twilio number. Nothing to provision.');
    return;
  }

  // ── 5. Provision a number for each agent that needs one ────────────────────
  console.log(`\nProvisioning numbers for ${needsNumber.length} agent(s)…`);

  const client     = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const webhookUrl = `${APP_URL}/api/webhooks/twilio`;

  for (const agent of needsNumber) {
    console.log(`\nProvisioning for ${agent.full_name} (${agent.email})…`);

    let available;
    try {
      available = await client.availablePhoneNumbers('US').local.list({ smsEnabled: true, limit: 1 });
    } catch (err) { console.error(`  ✗ Search failed: ${err.message}`); continue; }

    if (!available.length) { console.error('  ✗ No US numbers available from Twilio.'); continue; }

    let purchased;
    try {
      purchased = await client.incomingPhoneNumbers.create({
        phoneNumber: available[0].phoneNumber,
        smsUrl:      webhookUrl,
        smsMethod:   'POST',
      });
    } catch (err) { console.error(`  ✗ Purchase failed: ${err.message}`); continue; }

    const { error: saveErr } = await supabase
      .from('agents')
      .update({ twilio_phone_number: purchased.phoneNumber })
      .eq('id', agent.id);

    if (saveErr) {
      await client.incomingPhoneNumbers(purchased.sid).remove().catch(() => {});
      console.error(`  ✗ DB save failed (number released): ${saveErr.message}`);
      continue;
    }

    console.log(`  ✓ Assigned ${purchased.phoneNumber}`);
  }

  console.log('\nDone.');
}

run().catch(err => { console.error('Unexpected error:', err); process.exit(1); });
