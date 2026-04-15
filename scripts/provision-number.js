#!/usr/bin/env node
// ─── One-off: provision a Twilio number for agents who don't have one ─────────
// Usage: node scripts/provision-number.js
// Run from the repo root. Reads credentials from .env.local.
// Safe to run multiple times — skips agents that already have a number.

require('dotenv').config({ path: require('path').resolve(__dirname, '../apps/dashboard/.env.local') });

const twilio    = require('twilio');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

async function run() {
  console.log('Fetching agents without a Twilio number…');

  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, full_name, email, twilio_phone_number')
    .is('twilio_phone_number', null);

  if (error) { console.error('Supabase error:', error.message); process.exit(1); }
  if (!agents.length) { console.log('All agents already have a number. Nothing to do.'); return; }

  console.log(`Found ${agents.length} agent(s) without a number:\n`);
  agents.forEach(a => console.log(`  • ${a.full_name} (${a.email})`));
  console.log('');

  const client     = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const webhookUrl = `${APP_URL}/api/webhooks/twilio`;

  for (const agent of agents) {
    console.log(`Provisioning number for ${agent.full_name}…`);

    // Find an available US local number
    let available;
    try {
      available = await client.availablePhoneNumbers('US').local.list({ smsEnabled: true, limit: 1 });
    } catch (err) {
      console.error(`  ✗ Search failed: ${err.message}`);
      continue;
    }

    if (!available.length) {
      console.error('  ✗ No US local numbers available from Twilio.');
      continue;
    }

    // Purchase it and point its webhook at this app
    let purchased;
    try {
      purchased = await client.incomingPhoneNumbers.create({
        phoneNumber: available[0].phoneNumber,
        smsUrl:      webhookUrl,
        smsMethod:   'POST',
      });
    } catch (err) {
      console.error(`  ✗ Purchase failed: ${err.message}`);
      continue;
    }

    // Save to agents table
    const { error: saveError } = await supabase
      .from('agents')
      .update({ twilio_phone_number: purchased.phoneNumber })
      .eq('id', agent.id);

    if (saveError) {
      // Release the number so we don't leak a paid resource
      await client.incomingPhoneNumbers(purchased.sid).remove().catch(() => {});
      console.error(`  ✗ DB save failed (number released): ${saveError.message}`);
      continue;
    }

    console.log(`  ✓ Assigned ${purchased.phoneNumber} to ${agent.full_name}`);
  }

  console.log('\nDone.');
}

run().catch(err => { console.error('Unexpected error:', err); process.exit(1); });
