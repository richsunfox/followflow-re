'use server';

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ListingFormValues {
  address:      string;
  city:         string;
  price:        string;
  bedrooms:     string;
  bathrooms:    string;
  sqft:         string;
  propertyType: string;
  keyFeatures:  string;   // comma-separated
  agentNotes:   string;   // private notes — inform AI but don't quote verbatim
}

export interface ListingOutputs {
  mls:          string;
  social:       string;
  emailSubject: string;
  emailBody:    string;
}

export interface GenerateResult {
  outputs?:   ListingOutputs;
  listingId?: string;
  error?:     string;
}

export interface ListingHistoryItem {
  id:           string;
  address:      string;
  city:         string;
  price:        number | null;
  bedrooms:     number | null;
  bathrooms:    number | null;
  sqft:         number | null;
  property_type: string | null;
  description:  string | null;   // MLS
  social_caption: string | null;
  email_subject:  string | null;
  created_at:   string;
}

// ─── Generate + Save ──────────────────────────────────────────────────────────

export async function generateListingContent(
  values: ListingFormValues,
): Promise<GenerateResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const price  = Number(values.price);
    const sqft   = Number(values.sqft);
    const beds   = Number(values.bedrooms);
    const baths  = Number(values.bathrooms);

    const details = [
      `Address: ${values.address}, ${values.city}, California`,
      `List price: $${isNaN(price) ? values.price : price.toLocaleString()}`,
      `Bedrooms: ${values.bedrooms}`,
      `Bathrooms: ${values.bathrooms}`,
      `Size: ${isNaN(sqft) ? values.sqft : sqft.toLocaleString()} sq ft`,
      `Property type: ${values.propertyType.replace(/_/g, ' ')}`,
      values.keyFeatures ? `Key features: ${values.keyFeatures}` : null,
      values.agentNotes  ? `Agent's private context (use to inform tone and emphasis, do NOT quote verbatim): ${values.agentNotes}` : null,
    ].filter(Boolean).join('\n');

    const prompt = `You are a California real estate copywriter. Generate three pieces of marketing content for this property listing.

Property details:
${details}

Rules that apply to ALL three outputs:
- Describe only what is listed above — never invent features, views, upgrades, or finishes
- No clichés: "stunning", "gorgeous", "won't last", "priced to sell", "dream home", "a must see"
- Fair Housing compliant — no references to schools, school ratings, neighborhood demographics, or any protected class
- California-appropriate language (escrow, local lifestyle) where it fits naturally
- MLS description: 150-200 words exactly. Lead with the property's single strongest feature. Professional tone.
- Instagram caption: under 150 characters of copy (before hashtags). 2-3 emojis placed naturally. Strong CTA. Then a new line of 6-8 hashtags including the city and #JustListed.
- Just-listed email: 3 short paragraphs. Direct intro, 3-4 buyer-relevant highlights, showing invitation. Sign off with [Agent Name].

Return ONLY valid JSON with exactly these four keys — no markdown, no extra text:
{
  "mls": "...",
  "social": "...",
  "emailSubject": "...",
  "emailBody": "..."
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim()
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '');

    const parsed = JSON.parse(raw) as ListingOutputs;

    if (!parsed.mls || !parsed.social || !parsed.emailSubject || !parsed.emailBody) {
      throw new Error('Incomplete response from AI — please try again');
    }

    // Save to listings table
    const { data: listing, error: saveError } = await supabase
      .from('listings')
      .insert({
        agent_id:      user.id,
        address:       values.address,
        city:          values.city,
        state:         'CA',
        zip:           '',                   // not collected in form — can add later
        price:         isNaN(price) ? null : price,
        bedrooms:      isNaN(beds)  ? null : beds,
        bathrooms:     isNaN(baths) ? null : baths,
        sqft:          isNaN(sqft)  ? null : sqft,
        property_type: values.propertyType,
        key_features:  values.keyFeatures || null,
        agent_notes:   values.agentNotes   || null,
        description:   parsed.mls,
        social_caption: parsed.social,
        email_subject:  parsed.emailSubject,
        email_body:     parsed.emailBody,
        status:        'active',
      })
      .select('id')
      .single();

    if (saveError) {
      // Non-fatal: return outputs even if save fails
      console.error('[listings] Failed to save listing:', saveError.message);
    }

    return { outputs: parsed, listingId: listing?.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Generation failed — please try again';
    return { error };
  }
}

// ─── History fetch ─────────────────────────────────────────────────────────────

export async function getListingHistory(): Promise<ListingHistoryItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('listings')
    .select('id, address, city, price, bedrooms, bathrooms, sqft, property_type, description, social_caption, email_subject, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  return (data ?? []) as ListingHistoryItem[];
}
