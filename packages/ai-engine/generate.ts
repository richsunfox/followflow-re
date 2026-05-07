import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL = 'gemini-2.0-flash';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('Missing env var: GEMINI_API_KEY');

const genAI = new GoogleGenerativeAI(apiKey);

export type PromptType = 'lead_follow_up' | 'email_draft' | 'listing_description';

export interface VoiceProfile {
  communicationStyle?: string;
  signaturePhrase?: string;
  differentiator?: string;
  marketArea?: string;
  sampleSentence?: string;
  skipped?: boolean;
}

export interface AgentContext {
  fullName: string;
  brokerage?: string;
  phone?: string;
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

export interface GenerateResult {
  body: string;
  subject?: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

function buildVoiceBlock(vp?: VoiceProfile): string {
  if (!vp || vp.skipped) {
    return 'Write in a warm, professional, and friendly tone. Keep it brief and genuine.';
  }
  const lines: string[] = [];
  if (vp.communicationStyle) lines.push(`Communication style: ${vp.communicationStyle}`);
  if (vp.signaturePhrase)    lines.push(`Signature phrase (use naturally, not verbatim): "${vp.signaturePhrase}"`);
  if (vp.differentiator)     lines.push(`Agent differentiator: ${vp.differentiator}`);
  if (vp.marketArea)         lines.push(`Market area: ${vp.marketArea}`);
  if (vp.sampleSentence)     lines.push(`Sample sentence from the agent: "${vp.sampleSentence}"`);
  return lines.join('\n');
}

function buildLeadBlock(lead: LeadContext): string {
  const budget = lead.budgetMin && lead.budgetMax
    ? `$${lead.budgetMin.toLocaleString()} – $${lead.budgetMax.toLocaleString()}`
    : lead.budgetMax
    ? `up to $${lead.budgetMax.toLocaleString()}`
    : null;

  const lines: string[] = [
    `Name: ${lead.firstName} ${lead.lastName}`,
    `Lead type: ${lead.leadType}`,
    `Status: ${lead.status}`,
  ];
  if (lead.source)                       lines.push(`Source: ${lead.source}`);
  if (budget)                            lines.push(`Budget: ${budget}`);
  if (lead.desiredLocation)              lines.push(`Desired location: ${lead.desiredLocation}`);
  if (lead.desiredBedrooms)              lines.push(`Desired bedrooms: ${lead.desiredBedrooms}`);
  if (lead.daysSinceLastContact != null) lines.push(`Days since last contact: ${lead.daysSinceLastContact}`);
  if (lead.notes)                        lines.push(`Notes: ${lead.notes}`);
  return lines.join('\n');
}

export async function generateSMS({
  agent,
  lead,
  promptType,
  customInstruction,
}: {
  agent: AgentContext;
  lead: LeadContext;
  promptType: PromptType;
  customInstruction?: string;
}): Promise<GenerateResult> {
  const systemInstruction = `You are writing SMS follow-up messages on behalf of a real estate agent.

Agent: ${agent.fullName}${agent.brokerage ? ` at ${agent.brokerage}` : ''}
${agent.phone ? `Agent phone: ${agent.phone}` : ''}

Voice profile:
${buildVoiceBlock(agent.voiceProfile)}

Rules:
- Write only the SMS body text — no labels, no quotes, no explanation
- Maximum 160 characters
- Do not use em dashes or hashtags
- Sound like a real person texting, not a marketing blast
- Include the agent's first name as a sign-off
- Never invent property details not provided`;

  const userPrompt = `Write a personalized SMS follow-up for this lead.

Lead info:
${buildLeadBlock(lead)}
${customInstruction ? `\nAdditional instruction: ${customInstruction}` : ''}`;

  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction });
  const result = await model.generateContent(userPrompt);
  const response = result.response;
  const body = response.text().trim();

  return {
    body,
    inputTokens:  response.usageMetadata?.promptTokenCount     ?? 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    model:        MODEL,
  };
}

export async function generateEmail({
  agent,
  lead,
  promptType,
  customInstruction,
}: {
  agent: AgentContext;
  lead: LeadContext;
  promptType: PromptType;
  customInstruction?: string;
}): Promise<GenerateResult> {
  const systemInstruction = `You are writing follow-up emails on behalf of a real estate agent.

Agent: ${agent.fullName}${agent.brokerage ? ` at ${agent.brokerage}` : ''}
${agent.phone ? `Agent phone: ${agent.phone}` : ''}

Voice profile:
${buildVoiceBlock(agent.voiceProfile)}

Rules:
- Respond with exactly two sections separated by "---"
- First section: the subject line (one line, no "Subject:" prefix)
- Second section: the full email body
- Keep the email to 3–5 short paragraphs
- Sign off with the agent's full name and brokerage
- Do not use em dashes
- Never invent property details not provided`;

  const userPrompt = `Write a personalized follow-up email for this lead.

Lead info:
${buildLeadBlock(lead)}
${customInstruction ? `\nAdditional instruction: ${customInstruction}` : ''}`;

  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction });
  const result = await model.generateContent(userPrompt);
  const response = result.response;
  const raw = response.text().trim();

  const separatorIndex = raw.indexOf('---');
  const subject = separatorIndex !== -1 ? raw.slice(0, separatorIndex).trim() : undefined;
  const body    = separatorIndex !== -1 ? raw.slice(separatorIndex + 3).trim() : raw;

  return {
    body,
    subject,
    inputTokens:  response.usageMetadata?.promptTokenCount     ?? 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    model:        MODEL,
  };
}
