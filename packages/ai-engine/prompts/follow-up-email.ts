// ─── Follow-Up Email Prompt ───────────────────────────────────────────────────
// Generates a personalized follow-up email (subject + body) for a real estate lead.
// Designed for a California solo agent — professional but personal, not corporate.

export interface FollowUpEmailContext {
  // Agent
  agentFullName: string;
  agentBrokerage?: string;
  agentPhone?: string;
  agentEmail?: string;
  agentCalendlyUrl?: string;   // optional booking link

  // Lead
  leadFirstName: string;
  leadLastName: string;
  leadType: 'buyer' | 'seller' | 'both';
  leadStatus: 'new' | 'contacted' | 'nurturing' | 'hot' | 'warm' | 'cold';
  leadSource?: string;

  // Buyer context (optional)
  budgetMin?: number;
  budgetMax?: number;
  desiredLocation?: string;
  desiredBedrooms?: number;
  desiredBathrooms?: number;
  mustHaves?: string[];

  // Seller context (optional)
  propertyAddress?: string;
  estimatedHomeValue?: number;
  sellerTimeline?: string;    // e.g. "wants to sell by summer"

  // Sequence & timing
  followUpNumber: number;
  daysSinceLastContact?: number;
  previousTopicDiscussed?: string;
  specificPropertyToMention?: string;  // address/MLS to reference if applicable

  // Optional override
  customContext?: string;
}

export interface FollowUpEmailPrompt {
  system: string;
  user: string;
}

export function buildFollowUpEmailPrompt(ctx: FollowUpEmailContext): FollowUpEmailPrompt {
  const system = `You are helping ${ctx.agentFullName}${ctx.agentBrokerage ? ` at ${ctx.agentBrokerage}` : ''}, a solo real estate agent in California, write personalized follow-up emails to leads.

Voice and tone:
- Professional but approachable — like an email from a trusted advisor, not a corporate drip campaign
- California agents deal with sophisticated clients; avoid anything that sounds templated or generic
- Be direct and respectful of their time — no fluff, no filler paragraphs
- Personalize to their specific situation; generic emails get deleted
- One clear, low-pressure call to action per email

Content rules:
- Never fabricate market statistics, days on market, price trends, or inventory data
- Never promise a specific outcome ("I can get you top dollar", "I'll find your dream home")
- Do reference California-specific context naturally: escrow timelines, disclosure requirements, competitive offer situations, or seasonal market patterns if relevant
- If a Calendly link is provided, work it into the CTA naturally
- Sign off with full name${ctx.agentBrokerage ? `, ${ctx.agentBrokerage}` : ''}${ctx.agentPhone ? `, and phone number` : ''}

Format: Return ONLY valid JSON — no markdown, no explanation:
{"subject": "...", "body": "..."}`;

  const leadDescription = buildLeadDescription(ctx);
  const sequenceGuidance = buildSequenceGuidance(ctx);

  const user = `${leadDescription}

${sequenceGuidance}
${ctx.customContext ? `\nAdditional context: ${ctx.customContext}` : ''}
${ctx.agentCalendlyUrl ? `\nBooking link to include: ${ctx.agentCalendlyUrl}` : ''}

Write the follow-up email. Return ONLY valid JSON: {"subject": "...", "body": "..."}`;

  return { system, user };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildLeadDescription(ctx: FollowUpEmailContext): string {
  const lines: string[] = [
    `Lead: ${ctx.leadFirstName} ${ctx.leadLastName}`,
    `Type: ${ctx.leadType}`,
    `Status: ${ctx.leadStatus}`,
  ];

  if (ctx.leadSource) lines.push(`Lead source: ${ctx.leadSource}`);

  if (ctx.leadType === 'buyer' || ctx.leadType === 'both') {
    if (ctx.desiredLocation) lines.push(`Target area: ${ctx.desiredLocation}`);
    if (ctx.desiredBedrooms) lines.push(`Bedrooms needed: ${ctx.desiredBedrooms}+`);
    if (ctx.desiredBathrooms) lines.push(`Bathrooms needed: ${ctx.desiredBathrooms}+`);
    if (ctx.budgetMin || ctx.budgetMax) {
      const min = ctx.budgetMin ? `$${ctx.budgetMin.toLocaleString()}` : null;
      const max = ctx.budgetMax ? `$${ctx.budgetMax.toLocaleString()}` : null;
      lines.push(`Budget: ${[min, max].filter(Boolean).join(' – ')}`);
    }
    if (ctx.mustHaves?.length) lines.push(`Must-haves: ${ctx.mustHaves.join(', ')}`);
  }

  if (ctx.leadType === 'seller' || ctx.leadType === 'both') {
    if (ctx.propertyAddress) lines.push(`Property: ${ctx.propertyAddress}`);
    if (ctx.estimatedHomeValue) lines.push(`Est. home value: $${ctx.estimatedHomeValue.toLocaleString()}`);
    if (ctx.sellerTimeline) lines.push(`Seller timeline: ${ctx.sellerTimeline}`);
  }

  if (ctx.daysSinceLastContact !== undefined) {
    lines.push(`Days since last contact: ${ctx.daysSinceLastContact}`);
  }

  if (ctx.previousTopicDiscussed) {
    lines.push(`Previously discussed: ${ctx.previousTopicDiscussed}`);
  }

  if (ctx.specificPropertyToMention) {
    lines.push(`Property to reference: ${ctx.specificPropertyToMention}`);
  }

  return lines.join('\n');
}

function buildSequenceGuidance(ctx: FollowUpEmailContext): string {
  const { followUpNumber, leadStatus, leadType, daysSinceLastContact } = ctx;

  if (followUpNumber === 1) {
    if (leadType === 'seller') {
      return 'First email to a potential seller lead. Introduce yourself, acknowledge their interest in knowing their home\'s value or selling, and offer a no-pressure consultation. Mention you\'re familiar with the local California market.';
    }
    return 'First email to a new buyer lead. Introduce yourself, acknowledge what brought them in, and invite them to share more about what they\'re looking for. Keep it brief — this is just opening the door.';
  }

  if (followUpNumber === 2) {
    return 'Second follow-up — no reply yet. Reference the previous email briefly without sounding annoyed. Offer a different angle or a piece of value (a question, a resource, a market observation) to earn a response.';
  }

  if (followUpNumber === 3) {
    return 'Third follow-up. This is the last in the initial sequence before moving them to a long-term nurture. Keep it short, make it easy to reply with a one-word answer, and leave the door open without pressure.';
  }

  if (leadStatus === 'cold' || (daysSinceLastContact ?? 0) > 60) {
    return 'Re-engagement email for a lead who has gone cold (60+ days of silence). Acknowledge the time gap briefly, reference what they were originally interested in, and offer fresh value without dwelling on past unanswered messages.';
  }

  if (leadStatus === 'hot') {
    return 'Active, motivated lead. Be specific, be responsive, and move toward a concrete next step — a showing, a call, a property tour, or a listing consultation.';
  }

  if (leadStatus === 'nurturing') {
    return `Ongoing nurture email #${followUpNumber}. This lead isn't ready yet but is still engaged. Offer value — a market insight, a helpful tip, or a relevant property — without pushing for an immediate decision.`;
  }

  return `Follow-up #${followUpNumber}. Stay relevant to their situation and move the relationship forward naturally.`;
}
