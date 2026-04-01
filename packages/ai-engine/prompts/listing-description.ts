// ─── Listing Description Prompt ───────────────────────────────────────────────
// Generates a property listing description for MLS or marketing use.
// Written for California properties — accurate, evocative, compliant.

export type ListingDescriptionStyle =
  | 'mls'           // Factual, concise, under 250 words — standard MLS submission
  | 'marketing'     // Longer, more evocative — for Zillow, social media, flyers
  | 'email_feature' // Short teaser for use inside a lead follow-up email

export interface ListingDescriptionContext {
  // Agent
  agentFullName: string;
  agentBrokerage?: string;

  // Property basics
  address: string;
  city: string;
  neighborhood?: string;
  county?: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lotSize?: number;         // in sq ft or acres — specify in lotSizeUnit
  lotSizeUnit?: 'sqft' | 'acres';
  yearBuilt?: number;
  propertyType: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'land' | 'other';
  garage?: string;          // e.g. "2-car attached"
  pool?: boolean;
  view?: string;            // e.g. "ocean view", "mountain view", "city lights"

  // Interior highlights
  kitchenFeatures?: string[];    // e.g. ["quartz counters", "stainless appliances", "island"]
  primarySuiteFeatures?: string[]; // e.g. ["walk-in closet", "spa bath", "private balcony"]
  flooringType?: string;          // e.g. "hardwood throughout", "luxury vinyl"
  additionalRooms?: string[];     // e.g. ["home office", "bonus room", "ADU"]
  recentUpgrades?: string[];      // e.g. ["new roof 2022", "updated HVAC", "solar panels"]

  // Exterior & location highlights
  outdoorFeatures?: string[];     // e.g. ["entertainer's backyard", "built-in BBQ", "covered patio"]
  proximityHighlights?: string[]; // e.g. ["walk to downtown", "top-rated schools", "near freeway"]
  schoolDistrict?: string;

  // Style & output
  style: ListingDescriptionStyle;
  toneAdjective?: string;          // e.g. "luxury", "cozy", "modern", "charming"
  targetBuyer?: string;            // e.g. "young family", "move-up buyer", "investor"
}

export interface ListingDescriptionPrompt {
  system: string;
  user: string;
}

export function buildListingDescriptionPrompt(ctx: ListingDescriptionContext): ListingDescriptionPrompt {
  const system = `You are an expert real estate copywriter helping ${ctx.agentFullName}${ctx.agentBrokerage ? ` at ${ctx.agentBrokerage}` : ''} write property listing descriptions for California real estate.

Writing rules:
- Describe only what the agent has provided — never invent features, finishes, or facts
- Use vivid but accurate language; avoid clichés like "stunning", "gorgeous", "won't last long", "priced to sell", "a must see"
- California buyers are discerning — lead with lifestyle and location value, not just specs
- Comply with Fair Housing guidelines: no references to religion, race, national origin, familial status, disability, sex, or any other protected class
- Do not mention: school ratings, flood zones, proximity to places of worship, neighborhood demographics
- Do not make representations about investment returns or rental income potential
- Keep superlatives grounded — "generous primary suite" not "palatial master retreat"`;

  const propertyDescription = buildPropertyDescription(ctx);
  const styleInstructions = buildStyleInstructions(ctx);

  const user = `${propertyDescription}

${styleInstructions}

Write the listing description now. Return ONLY the description text — no labels, headers, or explanation.`;

  return { system, user };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPropertyDescription(ctx: ListingDescriptionContext): string {
  const lines: string[] = [
    `Property: ${ctx.address}, ${ctx.city}${ctx.neighborhood ? ` (${ctx.neighborhood})` : ''}`,
    `Price: $${ctx.price.toLocaleString()}`,
    `Type: ${ctx.propertyType.replace('_', ' ')}`,
    `Beds/Baths: ${ctx.bedrooms} bed / ${ctx.bathrooms} bath`,
    `Size: ${ctx.sqft.toLocaleString()} sq ft`,
  ];

  if (ctx.lotSize) {
    lines.push(`Lot: ${ctx.lotSize.toLocaleString()} ${ctx.lotSizeUnit ?? 'sqft'}`);
  }
  if (ctx.yearBuilt) lines.push(`Year built: ${ctx.yearBuilt}`);
  if (ctx.garage) lines.push(`Garage: ${ctx.garage}`);
  if (ctx.pool) lines.push(`Pool: yes`);
  if (ctx.view) lines.push(`View: ${ctx.view}`);
  if (ctx.flooringType) lines.push(`Flooring: ${ctx.flooringType}`);
  if (ctx.schoolDistrict) lines.push(`School district: ${ctx.schoolDistrict}`);

  if (ctx.kitchenFeatures?.length) {
    lines.push(`Kitchen: ${ctx.kitchenFeatures.join(', ')}`);
  }
  if (ctx.primarySuiteFeatures?.length) {
    lines.push(`Primary suite: ${ctx.primarySuiteFeatures.join(', ')}`);
  }
  if (ctx.additionalRooms?.length) {
    lines.push(`Additional rooms: ${ctx.additionalRooms.join(', ')}`);
  }
  if (ctx.recentUpgrades?.length) {
    lines.push(`Recent upgrades: ${ctx.recentUpgrades.join(', ')}`);
  }
  if (ctx.outdoorFeatures?.length) {
    lines.push(`Outdoor: ${ctx.outdoorFeatures.join(', ')}`);
  }
  if (ctx.proximityHighlights?.length) {
    lines.push(`Location highlights: ${ctx.proximityHighlights.join(', ')}`);
  }
  if (ctx.toneAdjective) lines.push(`Desired tone: ${ctx.toneAdjective}`);
  if (ctx.targetBuyer) lines.push(`Target buyer: ${ctx.targetBuyer}`);

  return lines.join('\n');
}

function buildStyleInstructions(ctx: ListingDescriptionContext): string {
  switch (ctx.style) {
    case 'mls':
      return `Write a standard MLS listing description.
- 150–250 words
- Lead with the property's strongest selling point in the first sentence
- Cover: location/neighborhood, layout/size, key interior features, standout upgrades, outdoor space, and lot/view if applicable
- End with a brief call to action ("Schedule your private tour today")
- No ALL CAPS, no excessive punctuation`;

    case 'marketing':
      return `Write a marketing-style listing description for Zillow, a property website, or a printed flyer.
- 250–400 words
- Open with an evocative hook that captures the lifestyle this home offers
- Paint a picture of how someone would live in this home — morning coffee on the patio, hosting in the open kitchen, etc.
- Include all key features but weave them into the narrative naturally
- Close with a compelling call to action`;

    case 'email_feature':
      return `Write a short property teaser for use inside a follow-up email to a buyer lead.
- 60–100 words only
- Lead with the most compelling feature for the target buyer
- Give just enough detail to create curiosity — not a full description
- End with a one-line invitation to see more or schedule a showing
- No headers, no bullet points — just 2–3 flowing sentences`;
  }
}
