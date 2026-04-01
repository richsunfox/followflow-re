// ─── Breakup Message Prompt ───────────────────────────────────────────────────
// Generates a final "breakup" message to a lead who has gone completely dark.
// The goal: one last genuine outreach that either re-engages or closes the loop.
// Designed for a California solo agent — honest, zero pressure, no guilt-tripping.

export type BreakupChannel = 'sms' | 'email';

export interface BreakupMessageContext {
  // Agent
  agentFirstName: string;
  agentFullName: string;
  agentBrokerage?: string;
  agentPhone?: string;
  agentEmail?: string;

  // Lead
  leadFirstName: string;
  leadLastName: string;
  leadType: 'buyer' | 'seller' | 'both';
  originalInterest?: string;       // e.g. "buying a 3BR in Pasadena", "selling their home in Torrance"
  weeksSinceLastContact: number;
  totalFollowUpAttempts: number;   // how many times the agent has already reached out

  // Optional context
  lastTopicDiscussed?: string;     // what was talked about before they went dark
  specificObstacleKnown?: string;  // e.g. "they mentioned waiting for rates to drop"

  // Output
  channel: BreakupChannel;
  tone: 'light_humor' | 'sincere' | 'ultra_brief';
}

export interface BreakupMessagePrompt {
  system: string;
  user: string;
}

export function buildBreakupMessagePrompt(ctx: BreakupMessageContext): BreakupMessagePrompt {
  const system = `You are helping ${ctx.agentFullName}${ctx.agentBrokerage ? ` at ${ctx.agentBrokerage}` : ''}, a solo real estate agent in California, write a final "breakup" message to a lead who has stopped responding.

The purpose of a breakup message:
- Give the lead one last chance to re-engage on their own terms
- Close the loop gracefully if they're no longer interested
- Leave a positive impression so they come back — or refer a friend — someday
- NOT to guilt-trip, pressure, or make them feel bad for not responding

What makes a great breakup message:
- It's honest about what it is — a final check-in before the agent moves on
- It makes it extremely easy to respond (a one-word reply should be enough)
- It has warmth, not frustration
- It's short — long messages from someone you've been ignoring feel suffocating
- In California especially, people are busy and transactional ghosting is common — don't take it personally and don't make them feel like they need to explain

What to NEVER do:
- Do not passive-aggressively reference how many times you've reached out
- Do not make the lead feel guilty
- Do not use the word "breakup" in the message itself
- Do not be sarcastic in a way that could be read as bitter
- Do not beg or oversell
- Do not use phrases like "I'll stop bothering you" — too needy`;

  const leadDescription = buildLeadDescription(ctx);
  const toneGuidance = buildToneGuidance(ctx);

  const formatInstruction = ctx.channel === 'email'
    ? 'Return ONLY valid JSON: {"subject": "...", "body": "..."}\nEmail length: 3–5 sentences max. Short is better.'
    : 'Return ONLY the SMS text — no labels or explanation.\nSMS length: under 280 characters.';

  const user = `${leadDescription}

${toneGuidance}

Write the ${ctx.channel === 'sms' ? 'SMS' : 'email'} breakup message from ${ctx.agentFirstName} to ${ctx.leadFirstName}. ${formatInstruction}`;

  return { system, user };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildLeadDescription(ctx: BreakupMessageContext): string {
  const lines: string[] = [
    `Lead: ${ctx.leadFirstName} ${ctx.leadLastName}`,
    `Type: ${ctx.leadType}`,
    `Weeks since last contact: ${ctx.weeksSinceLastContact}`,
    `Total follow-up attempts before this message: ${ctx.totalFollowUpAttempts}`,
  ];

  if (ctx.originalInterest) lines.push(`Originally interested in: ${ctx.originalInterest}`);
  if (ctx.lastTopicDiscussed) lines.push(`Last topic discussed: ${ctx.lastTopicDiscussed}`);
  if (ctx.specificObstacleKnown) lines.push(`Known obstacle: ${ctx.specificObstacleKnown}`);

  return lines.join('\n');
}

function buildToneGuidance(ctx: BreakupMessageContext): string {
  switch (ctx.tone) {
    case 'light_humor':
      return `Tone: Use light, self-aware humor. The agent is gently acknowledging that this is an unusual situation — reaching out one last time — without taking themselves too seriously. Think of it like a friend who knows you've been busy and says "hey, I get it, life happens." The humor should feel natural, not forced or cringe-worthy. If a joke doesn't fit naturally, leave it out.

Example energy (do not copy verbatim): "I've sent a few messages and you've gone full witness protection on me — I respect it. I just wanted to make sure everything's okay and let you know I'm still here if the timing ever makes sense."`;

    case 'sincere':
      return `Tone: Sincere and warm. No humor — just a genuine, human message. The agent acknowledges that life changes, priorities shift, and real estate decisions are big ones. This message should feel like it's coming from someone who genuinely cares about the lead's outcome, not someone checking a box.

The message should communicate: "No pressure. No hard feelings. I just want to make sure you're taken care of — whether that's with me or on your own."`;

    case 'ultra_brief':
      return `Tone: Ultra brief and direct. One or two sentences only. No explanation, no backstory, no softening. Just a simple, final check-in that takes two seconds to read and two seconds to reply to.

The entire message — including greeting and sign-off — should be under 160 characters for SMS or under 5 sentences for email. Respect their time by not asking for any of it.`;
  }
}
