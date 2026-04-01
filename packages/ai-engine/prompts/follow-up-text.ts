// ─── Follow-Up SMS Prompt ─────────────────────────────────────────────────────
// Generates a short, personalized SMS follow-up for a real estate lead.
// Designed for a California solo agent — warm, direct, never pushy.

export interface FollowUpTextContext {
  // Agent
  agentFirstName: string;
  agentFullName: string;
  agentBrokerage?: string;
  agentPhone?: string;

  // Lead
  leadFirstName: string;
  leadLastName: string;
  leadType: 'buyer' | 'seller' | 'both';
  leadStatus: 'new' | 'contacted' | 'nurturing' | 'hot' | 'warm' | 'cold';
  leadSource?: string;

  // Buyer context (optional)
  budgetMax?: number;
  desiredLocation?: string;
  desiredBedrooms?: number;

  // Seller context (optional)
  propertyAddress?: string;
  estimatedHomeValue?: number;

  // Sequence
  followUpNumber: number;         // 1 = first touch, 2 = second, etc.
  daysSinceLastContact?: number;
  previousTopicDiscussed?: string;

  // Optional override
  customContext?: string;
}

export interface FollowUpTextPrompt {
  system: string;
  user: string;
}

export function buildFollowUpTextPrompt(ctx: FollowUpTextContext): FollowUpTextPrompt {
  const system = `You are helping ${ctx.agentFullName}${ctx.agentBrokerage ? `, a solo real estate agent at ${ctx.agentBrokerage},` : ', a solo real estate agent,'} write personalized SMS follow-up messages to leads in California.

Your messages must:
- Sound like a real text from a real person — never a mass blast
- Be warm and low-pressure; California buyers and sellers are savvy and will disengage if they feel sold to
- Get to the point quickly — SMS is conversational, not formal
- Include exactly one soft call to action (reply, call, answer a question)
- Never mention interest rates, market stats, or prices unless the agent provided them
- Never use these phrases: "I hope you're doing well", "just checking in", "touching base", "circle back", "as per my last message"
- Always sign off with the agent's first name only
- Stay under 300 characters`;

  const leadDescription = buildLeadDescription(ctx);
  const sequenceGuidance = buildSequenceGuidance(ctx);

  const user = `${leadDescription}

${sequenceGuidance}
${ctx.customContext ? `\nAdditional context: ${ctx.customContext}` : ''}

Write a single SMS message from ${ctx.agentFirstName} to ${ctx.leadFirstName}. Return ONLY the SMS text — no labels, quotes, or explanation.`;

  return { system, user };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildLeadDescription(ctx: FollowUpTextContext): string {
  const lines: string[] = [
    `Lead: ${ctx.leadFirstName} ${ctx.leadLastName}`,
    `Type: ${ctx.leadType}`,
    `Status: ${ctx.leadStatus}`,
  ];

  if (ctx.leadSource) lines.push(`How they found the agent: ${ctx.leadSource}`);

  if (ctx.leadType === 'buyer' || ctx.leadType === 'both') {
    if (ctx.desiredLocation) lines.push(`Looking in: ${ctx.desiredLocation}`);
    if (ctx.desiredBedrooms) lines.push(`Wants: ${ctx.desiredBedrooms}+ bedrooms`);
    if (ctx.budgetMax) lines.push(`Budget: up to $${ctx.budgetMax.toLocaleString()}`);
  }

  if (ctx.leadType === 'seller' || ctx.leadType === 'both') {
    if (ctx.propertyAddress) lines.push(`Property: ${ctx.propertyAddress}`);
    if (ctx.estimatedHomeValue) lines.push(`Est. value: $${ctx.estimatedHomeValue.toLocaleString()}`);
  }

  if (ctx.daysSinceLastContact !== undefined) {
    lines.push(`Days since last contact: ${ctx.daysSinceLastContact}`);
  }

  if (ctx.previousTopicDiscussed) {
    lines.push(`Last conversation topic: ${ctx.previousTopicDiscussed}`);
  }

  return lines.join('\n');
}

function buildSequenceGuidance(ctx: FollowUpTextContext): string {
  const { followUpNumber, leadStatus, daysSinceLastContact } = ctx;

  if (followUpNumber === 1) {
    return 'This is the first follow-up after initial contact. Acknowledge how they got in touch and open a door for conversation.';
  }

  if (followUpNumber === 2) {
    return 'Second follow-up. They haven\'t responded yet. Keep it light — maybe ask a simple yes/no question to lower the barrier to reply.';
  }

  if (followUpNumber >= 3 && (leadStatus === 'cold' || (daysSinceLastContact ?? 0) > 30)) {
    return 'This lead has gone quiet. Write a low-pressure message that makes it easy to re-engage without making them feel guilty for not responding. A touch of humor or self-awareness works well here.';
  }

  if (leadStatus === 'hot') {
    return 'This is an active, motivated lead. Be responsive and specific — they\'re ready to move.';
  }

  return `This is follow-up #${followUpNumber}. Keep building rapport naturally without repeating the same angle as before.`;
}
