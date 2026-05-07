'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

export async function markThreadAsRead(
  messageIds: string[],
): Promise<{ error?: string; success?: boolean }> {
  if (messageIds.length === 0) return { success: true };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('inbound_messages')
    .update({ is_read: true })
    .in('id', messageIds)
    .eq('agent_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/inbox');
  revalidatePath('/leads');
  return { success: true };
}

export async function generateDraftReply(
  inboundBody: string,
  leadFirstName: string,
  channel: 'sms' | 'email',
): Promise<{ draft?: string; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: agent } = await supabase
    .from('agents')
    .select('full_name, brokerage, voice_profile')
    .eq('id', user.id)
    .maybeSingle();

  if (!agent) return { error: 'Agent not found' };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: 'AI service not configured' };

  const client = new Anthropic({ apiKey });

  const vp = agent.voice_profile as Record<string, string> | null;
  const voiceLines: string[] = [];
  if (vp && !vp.skipped) {
    if (vp.communicationStyle) voiceLines.push(`Communication style: ${vp.communicationStyle}`);
    if (vp.signaturePhrase)    voiceLines.push(`Signature phrase (use naturally): "${vp.signaturePhrase}"`);
    if (vp.differentiator)     voiceLines.push(`Your differentiator: ${vp.differentiator}`);
    if (vp.marketArea)         voiceLines.push(`Market area: ${vp.marketArea}`);
  }
  const voiceBlock = voiceLines.length > 0
    ? voiceLines.join('\n')
    : 'Write in a warm, professional, and friendly tone.';

  const isSMS = channel === 'sms';
  const agentLine = `${agent.full_name}${agent.brokerage ? ` at ${agent.brokerage}` : ''}`;

  const systemPrompt = `You are drafting a reply on behalf of real estate agent ${agentLine}.

Voice profile:
${voiceBlock}

Rules:
- Write ONLY the reply text — no labels, no quotes, no explanation
${isSMS
    ? '- Maximum 160 characters\n- Sound like a real person texting, not a marketing message'
    : '- Keep it to 2–3 short paragraphs\n- Professional but warm and human'}
- Do not use em dashes or hashtags
- Sign off naturally with the agent's first name`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: isSMS ? 256 : 512,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `${leadFirstName} just replied: "${inboundBody}"\n\nWrite a helpful, natural reply.`,
      },
    ],
  });

  const draft = message.content[0]?.type === 'text'
    ? message.content[0].text.trim()
    : '';

  return { draft };
}
