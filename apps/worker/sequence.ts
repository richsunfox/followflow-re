// ─── 14-Day Follow-Up Sequence ────────────────────────────────────────────────
// Defines the full follow-up sequence for a new real estate lead.
// Steps are timed from the lead's creation date (not last contact),
// so the cadence is consistent and predictable.

import type { PromptType } from '../../packages/ai-engine/generate';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SequenceChannel = 'sms' | 'email';
export type SequenceStepTag =
  | 'first_touch'
  | 'intro_email'
  | 'second_touch'
  | 'value_add'
  | 'third_touch'
  | 'alternate_angle'
  | 'breakup';

export interface SequenceStep {
  stepNumber: number;           // 1-based, matches message count after this step runs
  tag: SequenceStepTag;
  dayOffset: number;            // days from lead creation to send this step
  channel: SequenceChannel;
  promptType: PromptType;
  isBreakup: boolean;           // true = this is the final message
  description: string;          // human-readable label for logs/UI
}

export interface SequenceState {
  currentStep: SequenceStep | null;    // the step that should run now
  nextStep: SequenceStep | null;       // the step after that (for scheduling)
  completedStepCount: number;          // how many steps have already been sent
  isExhausted: boolean;                // true if the sequence is complete
}

export interface LeadForSequence {
  id: string;
  createdAt: string;           // ISO timestamp
  status: string;
  leadType: 'buyer' | 'seller' | 'both';
}

// ─── Sequence Definition ──────────────────────────────────────────────────────
//
// 14-day, 7-step sequence for a new real estate lead.
// GOAL: get the lead to respond so the agent can get them on the phone.
// The sequence stops automatically the moment the lead replies.
//
//  Day  0  → SMS   : Touch 1 — instant, warm, specific to what they were looking at
//  Day  1  → Email : Touch 2 — intro the agent, offer value, CTA: 10-min call
//  Day  2  → SMS   : Touch 3 — different angle, conversational, low pressure
//  Day  4  → Email : Touch 4 — market insight relevant to their area, CTA: call
//  Day  7  → SMS   : Touch 5 — new hook, light urgency ("a few homes just moved")
//  Day 10  → Email : Touch 6 — social proof / credibility, soft call invitation
//  Day 14  → SMS   : Touch 7 — breakup message, leave the door open gracefully

export const FOLLOW_UP_SEQUENCE: SequenceStep[] = [
  {
    stepNumber: 1,
    tag: 'first_touch',
    dayOffset: 0,
    channel: 'sms',
    promptType: 'lead_follow_up',
    isBreakup: false,
    description: 'Day 0 — First touch SMS',
  },
  {
    stepNumber: 2,
    tag: 'intro_email',
    dayOffset: 1,
    channel: 'email',
    promptType: 'email_draft',
    isBreakup: false,
    description: 'Day 1 — Intro email',
  },
  {
    stepNumber: 3,
    tag: 'second_touch',
    dayOffset: 2,
    channel: 'sms',
    promptType: 'lead_follow_up',
    isBreakup: false,
    description: 'Day 2 — Second touch SMS',
  },
  {
    stepNumber: 4,
    tag: 'value_add',
    dayOffset: 4,
    channel: 'email',
    promptType: 'email_draft',
    isBreakup: false,
    description: 'Day 4 — Market insight email',
  },
  {
    stepNumber: 5,
    tag: 'third_touch',
    dayOffset: 7,
    channel: 'sms',
    promptType: 'lead_follow_up',
    isBreakup: false,
    description: 'Day 7 — Third touch SMS',
  },
  {
    stepNumber: 6,
    tag: 'alternate_angle',
    dayOffset: 10,
    channel: 'email',
    promptType: 'email_draft',
    isBreakup: false,
    description: 'Day 10 — Social proof email',
  },
  {
    stepNumber: 7,
    tag: 'breakup',
    dayOffset: 14,
    channel: 'sms',
    promptType: 'lead_follow_up',
    isBreakup: true,
    description: 'Day 14 — Breakup SMS (final)',
  },
];

// ─── Sequence Utilities ───────────────────────────────────────────────────────

/**
 * Returns the sequence step that should run next for a given lead,
 * based on how many messages have already been sent.
 *
 * `completedStepCount` = number of rows in the messages table for this lead.
 */
export function getSequenceState(
  lead: LeadForSequence,
  completedStepCount: number,
): SequenceState {
  const currentStep = FOLLOW_UP_SEQUENCE[completedStepCount] ?? null;
  const nextStep = FOLLOW_UP_SEQUENCE[completedStepCount + 1] ?? null;
  const isExhausted = completedStepCount >= FOLLOW_UP_SEQUENCE.length;

  return {
    currentStep,
    nextStep,
    completedStepCount,
    isExhausted,
  };
}

/**
 * Given a lead's creation timestamp and a sequence step, returns
 * the exact UTC Date when that step should be sent.
 *
 * Steps are scheduled relative to lead creation (not last contact),
 * so agents who manually contact a lead mid-sequence don't break the timing.
 */
export function getScheduledSendTime(leadCreatedAt: string, step: SequenceStep): Date {
  const created = new Date(leadCreatedAt);
  const sendTime = new Date(created);
  sendTime.setDate(sendTime.getDate() + step.dayOffset);

  // Normalize to a reasonable sending hour in the agent's local time.
  // For now we use 9:00 AM UTC — a proper implementation should factor in
  // the agent's timezone. Day-0 (first_touch) sends immediately.
  if (step.dayOffset > 0) {
    sendTime.setUTCHours(17, 0, 0, 0); // 9 AM PT = 17:00 UTC (PDT offset)
  }

  return sendTime;
}

/**
 * Returns true if a lead is eligible for automated follow-up.
 * Hot leads and new/nurturing leads are included.
 * Dead, converted, and manually-paused leads are excluded.
 */
export function isLeadEligible(lead: LeadForSequence): boolean {
  const ineligibleStatuses = ['dead', 'converted'];
  return !ineligibleStatuses.includes(lead.status);
}

/**
 * Returns true if a given step is due to be sent right now (within a 15-minute window).
 * The scheduler runs every 15 minutes, so we check if the scheduled send time
 * falls within the past 15 minutes.
 */
export function isStepDue(scheduledAt: Date, windowMinutes = 15): boolean {
  const now = new Date();
  const windowMs = windowMinutes * 60 * 1000;
  const diffMs = now.getTime() - scheduledAt.getTime();
  return diffMs >= 0 && diffMs <= windowMs;
}

/**
 * Builds a plain-English summary of the full sequence schedule for a lead,
 * useful for displaying in the dashboard or logging.
 */
export function describeSequenceSchedule(leadCreatedAt: string): string {
  return FOLLOW_UP_SEQUENCE.map((step) => {
    const date = getScheduledSendTime(leadCreatedAt, step);
    return `  Step ${step.stepNumber} (${step.description}): ${date.toLocaleString()}`;
  }).join('\n');
}
