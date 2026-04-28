import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) throw new Error('Missing env: ANTHROPIC_API_KEY');

const client = new Anthropic({ apiKey });

const MODEL = 'claude-sonnet-4-6';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PromptType =
  | 'lead_follow_up'
  | 'sms_draft'
  | 'email_draft'
  | 'listing_description'
  | 'market_update'
  | 'past_client_outreach'
  | 'inbound_reply_suggestion'
  | 'other';

export interface VoiceProfile {
  communicationStyle?: string;  // 'formal' | 'casual' | 'friendly'
  signaturePhrase?:    string;
  differentiator?:     string;
  marketArea?:         string;
  sampleSentence?:     string;
}

export interface AgentContext {
  fullName:     string;
  brokerage?:   string;
  phone?:       string;
  voiceProfile?: VoiceProfile;
}

export interface LeadContext {
  firstName: string;
  lastName: string;
  leadType: 'buyer' | 'seller' | 'both';
  status: string;
  source?: string;
  budgetMin?: number;
  budgetMax?: number;
  desiredLocation?: string;
  desiredBedrooms?: number;
  notes?: string;
  daysSinceLastContact?: number;
}

export interface GenerateInput {
  agent: AgentContext;
  lead: LeadContext;
  promptType: PromptType;
  customInstruction?: string;
}

export interface SMSResult {
  body: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface EmailResult {
  subject: string;
  body: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

// ─── Shared system prompt ─────────────────────────────────────────────────────

function buildSystemPrompt(agent: AgentContext): string {
  const vp = agent.voiceProfile;

  const toneDescription: Record<string, string> = {
    formal:   'professional and polished — precise language, proper grammar, business-like tone',
    casual:   'relaxed and conversational — write like you\'d text a colleague, contractions welcome',
    friendly: 'warm and personable — build rapport, show genuine interest, upbeat but not over-the-top',
  };
  const toneInstruction = vp?.communicationStyle
    ? `Communication style: ${toneDescription[vp.communicationStyle] ?? vp.communicationStyle}`
    : 'Communication style: warm and professional';

  const voiceSection = vp ? `
── Agent voice profile ──
${toneInstruction}
${vp.marketArea        ? `Market area: ${vp.marketArea}` : ''}
${vp.differentiator    ? `What sets this agent apart: ${vp.differentiator}` : ''}
${vp.signaturePhrase   ? `Signature phrase / sign-off style: "${vp.signaturePhrase}"` : ''}
${vp.sampleSentence    ? `Example of how this agent actually writes — mirror this voice closely:\n"${vp.sampleSentence}"` : ''}
── End voice profile ──` : '';

  return `You are ghostwriting follow-up messages on behalf of a real estate agent. Every message must sound like it came directly from the agent — not from an AI, not from a template.

Agent: ${agent.fullName}${agent.brokerage ? ` at ${agent.brokerage}` : ''}${agent.phone ? ` (${agent.phone})` : ''}
${voiceSection}

Core philosophy — every message has ONE goal: get the lead to respond so the agent can get them on the phone. Everything else is secondary.

Rules:
- Match the agent's voice profile exactly — tone, vocabulary, sentence length
- If a sample sentence is provided, treat it as a voice fingerprint and write in that same style
- Personalize every message to the lead's specific situation
- One clear call to action per message — always reply, call, or book a quick call
- Every SMS must end with a soft, low-friction question that invites a reply — never a statement
- Never invent property details, prices, or market statistics not provided
- Never use filler phrases like "I hope this message finds you well" or "Don't hesitate to reach out"
- Never give the lead an excuse not to reply — keep friction as low as possible
- Always sign off with the agent's name`;
}

// ─── Lead context summary ─────────────────────────────────────────────────────

function describeLeadContext(lead: LeadContext): string {
  const lines: string[] = [
    `Lead: ${lead.firstName} ${lead.lastName}`,
    `Type: ${lead.leadType}`,
    `Status: ${lead.status}`,
  ];
  if (lead.source) lines.push(`Source: ${lead.source}`);
  if (lead.budgetMin || lead.budgetMax) {
    const min = lead.budgetMin ? `$${lead.budgetMin.toLocaleString()}` : null;
    const max = lead.budgetMax ? `$${lead.budgetMax.toLocaleString()}` : null;
    lines.push(`Budget: ${[min, max].filter(Boolean).join(' – ')}`);
  }
  if (lead.desiredLocation) lines.push(`Desired location: ${lead.desiredLocation}`);
  if (lead.desiredBedrooms) lines.push(`Desired bedrooms: ${lead.desiredBedrooms}+`);
  if (lead.daysSinceLastContact !== undefined) {
    lines.push(`Days since last contact: ${lead.daysSinceLastContact}`);
  }
  if (lead.notes) lines.push(`Notes: ${lead.notes}`);
  return lines.join('\n');
}

// ─── SMS generator ────────────────────────────────────────────────────────────

/**
 * Generate a short SMS follow-up message for a lead.
 * Output is kept under ~300 characters — conversational, not formal.
 */
export async function generateSMS(input: GenerateInput): Promise<SMSResult> {
  const { agent, lead, promptType, customInstruction } = input;

  const userPrompt = `${describeLeadContext(lead)}

Write a short, friendly SMS follow-up message from ${agent.fullName} to this lead.
${customInstruction ? `Additional instruction: ${customInstruction}` : getDefaultSMSInstruction(promptType, lead)}

Requirements:
- Under 300 characters
- Conversational tone, like a text from a real person — not a template, not marketing copy
- Must end with a soft question that makes it easy to reply (e.g. "are you free for a quick call this week?" or "does that sound helpful?")
- Never end with a statement — the final sentence must always be a question
- End with the agent's first name only
- Return ONLY the SMS text, no labels or explanation`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: buildSystemPrompt(agent),
    messages: [{ role: 'user', content: userPrompt }],
  });

  const body = extractText(response.content);

  return {
    body,
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

// ─── Email generator ──────────────────────────────────────────────────────────

/**
 * Generate a follow-up email (subject + body) for a lead.
 */
export async function generateEmail(input: GenerateInput): Promise<EmailResult> {
  const { agent, lead, promptType, customInstruction } = input;

  const userPrompt = `${describeLeadContext(lead)}

Write a follow-up email from ${agent.fullName} to this lead.
${customInstruction ? `Additional instruction: ${customInstruction}` : getDefaultEmailInstruction(promptType, lead)}

Requirements:
- Subject line: concise, personal, conversational — not clickbait, not a newsletter headline
- Body: 3–5 short paragraphs, friendly but professional
- Exactly ONE call to action — either "reply to this email", "give me a call", or "book a quick call" — pick the most natural one and use it once
- The final paragraph should close with the CTA as a soft question (e.g. "Would a 10-minute call be helpful?")
- Sign off with the agent's full name${agent.brokerage ? ` and ${agent.brokerage}` : ''}
- Return ONLY valid JSON in this exact format, no extra text:
{
  "subject": "...",
  "body": "..."
}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(agent),
    messages: [{ role: 'user', content: userPrompt }],
  });

  const raw = extractText(response.content);
  const parsed = parseEmailJSON(raw);

  return {
    subject: parsed.subject,
    body: parsed.body,
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

// ─── Default instructions by prompt type ─────────────────────────────────────

function getDefaultSMSInstruction(type: PromptType, lead: LeadContext): string {
  switch (type) {
    case 'lead_follow_up':
      return lead.daysSinceLastContact && lead.daysSinceLastContact > 14
        ? 'Re-engage a lead who has gone quiet. Keep it casual and low-pressure. End with a question that\'s easy to answer — the goal is to get a reply so the agent can get them on the phone.'
        : 'Follow up with a new or active lead. The goal is to get a reply that leads to a phone call. End with a soft question like "are you free for a quick call this week?"';
    case 'past_client_outreach':
      return 'Check in with a past client — keep it warm and personal. End with a question that opens the door to a conversation.';
    case 'inbound_reply_suggestion':
      return 'Suggest a reply to an inbound message from a lead. Match their tone. Aim to move the conversation toward a phone call.';
    default:
      return 'Write a friendly follow-up SMS. End with a soft question that invites a reply — the goal is to get them on the phone.';
  }
}

function getDefaultEmailInstruction(type: PromptType, lead: LeadContext): string {
  switch (type) {
    case 'lead_follow_up':
      return lead.daysSinceLastContact && lead.daysSinceLastContact > 30
        ? 'Re-engage a lead who has gone cold. Acknowledge the time gap naturally. End with a single soft CTA — a quick call or reply.'
        : 'Send a warm follow-up to an active lead. One CTA only: offer a 10-minute call. Close with "Would a quick call be helpful?"';
    case 'market_update':
      return `Share a brief, relevant market insight for a ${lead.leadType} in ${lead.desiredLocation ?? 'their target area'}. Keep it genuinely useful. CTA is a call — "would it be worth a quick chat about what this means for you?"`;
    case 'past_client_outreach':
      return 'Check in with a past client. Reference their home naturally. Offer value, not a pitch. End by leaving the door open for a call.';
    case 'listing_description':
      return 'Introduce a listing that may be a match for this buyer. One CTA: invite them to call or reply to set up a showing.';
    default:
      return 'Write a professional follow-up email. One CTA only — reply, call, or book a quick call. Close with a soft question.';
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractText(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
}

function parseEmailJSON(raw: string): { subject: string; body: string } {
  // Strip markdown code fences if Claude wraps the JSON
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.subject !== 'string' || typeof parsed.body !== 'string') {
      throw new Error('Missing subject or body in response');
    }
    return parsed;
  } catch {
    throw new Error(`Failed to parse email JSON from AI response:\n${raw}`);
  }
}
