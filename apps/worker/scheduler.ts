// ─── Background Scheduler ─────────────────────────────────────────────────────
// Runs every 15 minutes. Checks Supabase for leads due a follow-up,
// generates AI messages, logs them to the messages table, and schedules
// the next step. Uses the service role key — never run this in the browser.

import cron from 'node-cron';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { supabaseAdmin } from '../../packages/database/client';
import { generateSMS, generateEmail } from '../../packages/ai-engine/generate';
import type { AgentContext, LeadContext } from '../../packages/ai-engine/generate';
import { sendSMS } from '../../packages/delivery/sms';
import {
  FOLLOW_UP_SEQUENCE,
  getSequenceState,
  getScheduledSendTime,
  isLeadEligible,
} from './sequence';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentRow {
  id:                  string;
  full_name:           string;
  phone:               string | null;
  brokerage:           string | null;
  twilio_phone_number: string | null;
}

interface LeadRow {
  id: string;
  agent_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  lead_type: 'buyer' | 'seller' | 'both';
  status: string;
  source: string | null;
  budget_min: number | null;
  budget_max: number | null;
  desired_location: string | null;
  desired_bedrooms: number | null;
  notes: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  sequence_day:       number;
  sequence_paused:    boolean;
  sequence_completed: boolean;
  agents: AgentRow;
}

interface ProcessResult {
  leadId: string;
  leadName: string;
  stepNumber: number;
  channel: string;
  status: 'success' | 'skipped' | 'error';
  reason?: string;
}

// ─── Cost calculation ─────────────────────────────────────────────────────────
// Claude Sonnet 4.6 pricing (update if pricing changes):
// $3.00 / 1M input tokens, $15.00 / 1M output tokens

const INPUT_COST_PER_TOKEN  = 3.00  / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 15.00 / 1_000_000;

function calculateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * INPUT_COST_PER_TOKEN) + (outputTokens * OUTPUT_COST_PER_TOKEN);
}

// ─── Processing lock ──────────────────────────────────────────────────────────
// Prevents overlapping runs if a tick takes longer than 15 minutes.

let isRunning = false;

// ─── Main job ─────────────────────────────────────────────────────────────────

async function processFollowUps(): Promise<void> {
  if (isRunning) {
    log('warn', 'Previous run still in progress — skipping this tick');
    return;
  }

  isRunning = true;
  const tickStart = Date.now();
  log('info', 'Follow-up scheduler tick started');

  try {
    const leads = await fetchDueLeads();
    log('info', `Found ${leads.length} lead(s) due for follow-up`);

    if (leads.length === 0) {
      return;
    }

    const results: ProcessResult[] = [];

    for (const lead of leads) {
      const result = await processLead(lead);
      results.push(result);

      // Small delay between leads to avoid Anthropic rate limits
      await sleep(500);
    }

    summarizeResults(results, tickStart);
  } catch (err) {
    log('error', 'Unhandled error in scheduler tick', err);
  } finally {
    isRunning = false;
  }
}

// ─── Fetch leads due for follow-up ───────────────────────────────────────────

async function fetchDueLeads(): Promise<LeadRow[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('leads')
    .select(`
      id, agent_id, first_name, last_name, phone, lead_type, status,
      source, budget_min, budget_max, desired_location, desired_bedrooms,
      notes, last_contacted_at, next_follow_up_at, created_at,
      sequence_day, sequence_paused, sequence_completed,
      agents!inner (
        id, full_name, phone, brokerage,
        twilio_phone_number
      )
    `)
    .lte('next_follow_up_at', now)
    .eq('sequence_paused', false)
    .eq('sequence_completed', false)
    .not('status', 'in', '("dead","converted","replied")')
    .order('next_follow_up_at', { ascending: true })
    .limit(100);

  if (error) throw new Error(`Failed to fetch due leads: ${error.message}`);
  return (data ?? []) as unknown as LeadRow[];
}

// ─── Process a single lead ────────────────────────────────────────────────────

async function processLead(lead: LeadRow): Promise<ProcessResult> {
  const leadName = `${lead.first_name} ${lead.last_name}`;

  try {
    // Eligibility check (paused/completed are already filtered by query)
    if (!isLeadEligible({ id: lead.id, createdAt: lead.created_at, status: lead.status, leadType: lead.lead_type })) {
      return { leadId: lead.id, leadName, stepNumber: 0, channel: '-', status: 'skipped', reason: 'ineligible status' };
    }

    // Use sequence_day to determine current step (avoids a separate count query)
    const completedStepCount = lead.sequence_day;
    const state = getSequenceState(
      { id: lead.id, createdAt: lead.created_at, status: lead.status, leadType: lead.lead_type },
      completedStepCount,
    );

    // Sequence exhausted
    if (state.isExhausted || !state.currentStep) {
      await markSequenceComplete(lead);
      return { leadId: lead.id, leadName, stepNumber: completedStepCount, channel: '-', status: 'skipped', reason: 'sequence exhausted' };
    }

    const step = state.currentStep;
    const agent = lead.agents;

    // Build context objects
    const agentCtx: AgentContext = {
      fullName: agent.full_name,
      brokerage: agent.brokerage ?? undefined,
      phone: agent.phone ?? undefined,
    };

    const daysSinceLastContact = lead.last_contacted_at
      ? Math.floor((Date.now() - new Date(lead.last_contacted_at).getTime()) / 86_400_000)
      : undefined;

    const leadCtx: LeadContext = {
      firstName: lead.first_name,
      lastName: lead.last_name,
      leadType: lead.lead_type,
      status: lead.status,
      source: lead.source ?? undefined,
      budgetMin: lead.budget_min ?? undefined,
      budgetMax: lead.budget_max ?? undefined,
      desiredLocation: lead.desired_location ?? undefined,
      desiredBedrooms: lead.desired_bedrooms ?? undefined,
      notes: lead.notes ?? undefined,
      daysSinceLastContact,
    };

    const customInstruction = buildCustomInstruction(step.tag, lead, completedStepCount);

    // Generate the message
    log('info', `Generating step ${step.stepNumber} (${step.description}) for ${leadName} via ${step.channel}`);

    let messageBody: string;
    let messageSubject: string | undefined;
    let inputTokens: number;
    let outputTokens: number;
    let model: string;

    if (step.channel === 'sms') {
      const result = await generateSMS({ agent: agentCtx, lead: leadCtx, promptType: step.promptType, customInstruction });
      messageBody    = result.body;
      inputTokens    = result.inputTokens;
      outputTokens   = result.outputTokens;
      model          = result.model;
    } else {
      const result = await generateEmail({ agent: agentCtx, lead: leadCtx, promptType: step.promptType, customInstruction });
      messageBody    = result.body;
      messageSubject = result.subject;
      inputTokens    = result.inputTokens;
      outputTokens   = result.outputTokens;
      model          = result.model;
    }

    // Insert message record
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('messages')
      .insert({
        agent_id:     lead.agent_id,
        lead_id:      lead.id,
        channel:      step.channel,
        subject:      messageSubject ?? null,
        body:         messageBody,
        status:       'pending',
        ai_generated: true,
      })
      .select('id')
      .single();

    if (insertError) throw new Error(`Failed to insert message: ${insertError.message}`);

    // ── Send SMS via FollowFlow's shared Twilio account ───────────────────────
    if (step.channel === 'sms' && inserted) {
      const { twilio_phone_number } = agent;

      if (!twilio_phone_number) {
        log('warn', `Agent ${agent.full_name} has no assigned Twilio number — message saved as pending but not sent`);
      } else if (!lead.phone) {
        log('warn', `Lead ${leadName} has no phone number — message saved as pending but not sent`);
        await supabaseAdmin
          .from('messages')
          .update({ status: 'failed', error_message: 'Lead has no phone number' })
          .eq('id', inserted.id);
      } else {
        const sendResult = await sendSMS(lead.phone, messageBody, twilio_phone_number, inserted.id);
        const statusUpdate = sendResult.status === 'sent'
          ? { status: 'sent', provider_message_id: sendResult.twilioSid ?? null, sent_at: new Date().toISOString(), error_message: null }
          : { status: 'failed', error_message: sendResult.error ?? 'Unknown error' };
        await supabaseAdmin.from('messages').update(statusUpdate).eq('id', inserted.id);
      }
    }

    // Log AI usage
    const cost = calculateCost(inputTokens, outputTokens);
    await supabaseAdmin.from('ai_usage').insert({
      agent_id:     lead.agent_id,
      lead_id:      lead.id,
      model,
      prompt_type:  step.promptType,
      input_tokens:  inputTokens,
      output_tokens: outputTokens,
      cost_usd:      cost,
    });

    // Advance the sequence: update sequence_day, schedule next step or mark complete
    await advanceSequence(lead, step.stepNumber, state.nextStep);

    return { leadId: lead.id, leadName, stepNumber: step.stepNumber, channel: step.channel, status: 'success' };

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log('error', `Failed to process lead ${leadName} (${lead.id}): ${message}`);
    return { leadId: lead.id, leadName, stepNumber: 0, channel: '-', status: 'error', reason: message };
  }
}

// ─── Sequence advancement ─────────────────────────────────────────────────────

async function advanceSequence(
  lead: LeadRow,
  completedStepNumber: number,
  nextStep: (typeof FOLLOW_UP_SEQUENCE)[number] | null,
): Promise<void> {
  const now = new Date().toISOString();

  if (nextStep) {
    const nextSendTime = getScheduledSendTime(lead.created_at, nextStep);
    await supabaseAdmin
      .from('leads')
      .update({
        last_contacted_at: now,
        next_follow_up_at: nextSendTime.toISOString(),
        sequence_day:      completedStepNumber,
      })
      .eq('id', lead.id);
  } else {
    await markSequenceComplete(lead, completedStepNumber);
  }
}

async function markSequenceComplete(lead: LeadRow, completedStepNumber?: number): Promise<void> {
  await supabaseAdmin
    .from('leads')
    .update({
      next_follow_up_at:  null,
      sequence_completed: true,
      sequence_day:       completedStepNumber ?? lead.sequence_day,
      // Only downgrade status if they haven't been promoted (hot/warm stay put)
      status: ['new', 'contacted', 'nurturing'].includes(lead.status) ? 'cold' : lead.status,
    })
    .eq('id', lead.id);
}

// ─── Custom instructions per sequence step ────────────────────────────────────

function buildCustomInstruction(
  tag: string,
  lead: LeadRow,
  completedStepCount: number,
): string {
  switch (tag) {
    case 'first_touch':
      return `This is the very first message to ${lead.first_name}. Acknowledge how they found the agent (${lead.source ?? 'online'}) and open a low-pressure door to conversation. Keep it short and friendly.`;

    case 'intro_email':
      return `First email to ${lead.first_name}. Introduce the agent, establish credibility as a local California expert, and offer a no-pressure next step. Mention their interest in ${lead.desired_location ?? 'real estate'}.`;

    case 'second_touch':
      return `Second SMS — ${lead.first_name} hasn't responded yet. Ask a single, simple yes/no or short-answer question that's easy to reply to. Don't rehash the first message.`;

    case 'value_add':
      return `Send a value-add email. Offer something genuinely useful — a market observation, a question about their search criteria, or a relevant tip for ${lead.lead_type === 'seller' ? 'selling' : 'buying'} in California. No hard ask.`;

    case 'third_touch':
      return `Third SMS — try a completely different angle. If previous messages were about their search, ask about their timeline. If about timeline, ask what's holding them back. Keep it conversational.`;

    case 'alternate_angle':
      return `This lead has received ${completedStepCount} messages with no reply. Address a common hesitation for ${lead.lead_type === 'seller' ? 'sellers' : 'buyers'} in California — e.g., timing the market, competing offers, or pricing concerns — without being presumptuous.`;

    case 'breakup':
      return `Final message. ${lead.first_name} has not responded after ${completedStepCount} attempts over 14 days. Write a genuine, low-pressure breakup message that either invites a reply or closes the loop gracefully. No guilt, no pressure. Leave a good impression.`;

    default:
      return `Follow-up #${completedStepCount + 1} for ${lead.first_name}. Stay relevant to their situation.`;
  }
}

// ─── Logging ──────────────────────────────────────────────────────────────────

function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [scheduler] [${level.toUpperCase()}]`;
  if (data) {
    console[level === 'info' ? 'log' : level](`${prefix} ${message}`, data);
  } else {
    console[level === 'info' ? 'log' : level](`${prefix} ${message}`);
  }
}

function summarizeResults(results: ProcessResult[], tickStart: number): void {
  const success  = results.filter(r => r.status === 'success').length;
  const skipped  = results.filter(r => r.status === 'skipped').length;
  const errors   = results.filter(r => r.status === 'error').length;
  const duration = ((Date.now() - tickStart) / 1000).toFixed(1);

  log('info', `Tick complete in ${duration}s — ${success} sent, ${skipped} skipped, ${errors} errors`);

  if (errors > 0) {
    results.filter(r => r.status === 'error').forEach(r => {
      log('error', `  ✗ ${r.leadName} (${r.leadId}): ${r.reason}`);
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Cron schedule ────────────────────────────────────────────────────────────

export function startScheduler(): void {
  log('info', 'FollowFlow RE worker starting...');

  // Run immediately on start to catch any leads that became due while the worker was down
  processFollowUps();

  // Then run every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    processFollowUps();
  });

  log('info', 'Scheduler running — checking for due follow-ups every 15 minutes');
}

// ─── Entry point ─────────────────────────────────────────────────────────────

// Allow running directly: ts-node apps/worker/scheduler.ts
if (require.main === module) {
  startScheduler();

  // Keep the process alive
  process.on('SIGINT', () => {
    log('info', 'Received SIGINT — shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log('info', 'Received SIGTERM — shutting down gracefully');
    process.exit(0);
  });
}
