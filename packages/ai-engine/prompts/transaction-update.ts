// ─── Transaction Update Prompt ────────────────────────────────────────────────
// Generates a client-facing message for a transaction milestone.
// Written for a California solo agent using escrow-based closings.

export type TransactionMilestone =
  | 'offer_accepted'
  | 'inspection_scheduled'
  | 'inspection_complete'
  | 'contingency_removed'
  | 'appraisal_ordered'
  | 'appraisal_complete'
  | 'loan_approved'
  | 'clear_to_close'
  | 'closing_scheduled'
  | 'keys_handed_over'
  | 'listing_went_live'
  | 'offer_received'
  | 'under_contract'
  | 'custom';

export type TransactionSide = 'buyer' | 'seller';
export type UpdateChannel = 'sms' | 'email';

export interface TransactionUpdateContext {
  // Agent
  agentFullName: string;
  agentFirstName: string;
  agentBrokerage?: string;
  agentPhone?: string;

  // Client
  clientFirstName: string;
  clientLastName: string;
  clientSide: TransactionSide;

  // Transaction
  propertyAddress: string;
  city: string;
  milestone: TransactionMilestone;
  closingDate?: string;        // e.g. "April 15"
  purchasePrice?: number;

  // Milestone-specific details (optional but improve quality)
  inspectionDate?: string;
  inspectionFindings?: string; // e.g. "minor items only — no major repairs needed"
  appraisalValue?: number;
  loanAmount?: number;
  contingencyType?: string;    // e.g. "inspection", "loan", "appraisal"
  nextSteps?: string[];        // agent-defined list of what happens next
  customMilestoneDescription?: string; // used when milestone = 'custom'

  // Output
  channel: UpdateChannel;
}

export interface TransactionUpdatePrompt {
  system: string;
  user: string;
}

export function buildTransactionUpdatePrompt(ctx: TransactionUpdateContext): TransactionUpdatePrompt {
  const system = `You are helping ${ctx.agentFullName}${ctx.agentBrokerage ? ` at ${ctx.agentBrokerage}` : ''}, a solo real estate agent in California, communicate transaction updates to their clients.

California real estate context:
- Transactions close through escrow (not attorneys) — use terms like "escrow", "escrow officer", "close of escrow (COE)"
- Standard CA contingency periods: inspection (typically 10–17 days), loan (typically 21 days), appraisal (typically 17 days)
- CAR (California Association of Realtors) forms govern the transaction
- "Keys" are typically handed over at or after close of escrow, not at a closing table

Communication rules:
- Be clear and reassuring — real estate transactions are stressful; your job is to reduce anxiety
- Translate jargon into plain English when needed
- Be specific about what just happened and what comes next
- Never minimize legitimate concerns or make promises about outcomes
- Keep the tone warm — this is a major life event for your client
- ${ctx.channel === 'sms' ? 'SMS: keep under 320 characters, sign with first name only' : 'Email: 3–5 short paragraphs, sign with full name and contact info'}`;

  const transactionDetails = buildTransactionDetails(ctx);
  const milestoneContext = buildMilestoneContext(ctx);

  const formatInstruction = ctx.channel === 'email'
    ? 'Return ONLY valid JSON: {"subject": "...", "body": "..."}'
    : 'Return ONLY the SMS text — no labels or explanation.';

  const user = `${transactionDetails}

${milestoneContext}

Write the ${ctx.channel === 'sms' ? 'SMS' : 'email'} update from ${ctx.agentFirstName} to ${ctx.clientFirstName}. ${formatInstruction}`;

  return { system, user };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildTransactionDetails(ctx: TransactionUpdateContext): string {
  const lines: string[] = [
    `Client: ${ctx.clientFirstName} ${ctx.clientLastName} (${ctx.clientSide})`,
    `Property: ${ctx.propertyAddress}, ${ctx.city}`,
  ];

  if (ctx.purchasePrice) lines.push(`Purchase price: $${ctx.purchasePrice.toLocaleString()}`);
  if (ctx.closingDate) lines.push(`Scheduled closing date: ${ctx.closingDate}`);
  if (ctx.loanAmount) lines.push(`Loan amount: $${ctx.loanAmount.toLocaleString()}`);

  return lines.join('\n');
}

function buildMilestoneContext(ctx: TransactionUpdateContext): string {
  const { milestone, clientSide } = ctx;

  const milestoneDescriptions: Record<TransactionMilestone, string> = {
    offer_accepted: clientSide === 'buyer'
      ? 'Their offer was just accepted by the seller. Escrow has been opened.'
      : 'You accepted an offer from a buyer. Escrow has been opened.',
    inspection_scheduled: `Home inspection has been scheduled${ctx.inspectionDate ? ` for ${ctx.inspectionDate}` : ''}.`,
    inspection_complete: `Home inspection is complete.${ctx.inspectionFindings ? ` Findings: ${ctx.inspectionFindings}.` : ''} The inspection contingency review period is now active.`,
    contingency_removed: `The ${ctx.contingencyType ?? 'contingency'} contingency has been removed. The transaction is moving forward.`,
    appraisal_ordered: 'The appraisal has been ordered by the lender.',
    appraisal_complete: `The appraisal is complete.${ctx.appraisalValue ? ` The property appraised at $${ctx.appraisalValue.toLocaleString()}.` : ''}`,
    loan_approved: 'The lender has issued a loan approval.',
    clear_to_close: 'The lender has issued a "Clear to Close" — final loan approval is in hand. Escrow is preparing closing documents.',
    closing_scheduled: `Closing is officially scheduled${ctx.closingDate ? ` for ${ctx.closingDate}` : ''}.`,
    keys_handed_over: clientSide === 'buyer'
      ? 'The transaction has closed and keys have been handed over. Congratulations — they are now a homeowner!'
      : 'The transaction has closed. Congratulations on the successful sale!',
    listing_went_live: 'The listing is now live on the MLS and all syndicated sites.',
    offer_received: 'A new offer has been received on the listing and is under review.',
    under_contract: 'The property is now under contract.',
    custom: ctx.customMilestoneDescription ?? 'A significant transaction update has occurred.',
  };

  let context = `Milestone: ${milestoneDescriptions[milestone]}`;

  if (ctx.nextSteps?.length) {
    context += `\n\nNext steps the agent wants to communicate:\n${ctx.nextSteps.map(s => `- ${s}`).join('\n')}`;
  } else {
    context += `\n\nInclude relevant next steps based on this milestone and California escrow process.`;
  }

  return context;
}
