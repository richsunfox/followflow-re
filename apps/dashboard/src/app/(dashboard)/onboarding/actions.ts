'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { provisionPhoneNumber } from '@/lib/twilio/provision';

export interface VoiceProfileAnswers {
  communicationStyle: string;  // 'formal' | 'casual' | 'friendly'
  signaturePhrase:    string;
  differentiator:     string;
  marketArea:         string;
  sampleSentence:     string;
}

export interface SaveResult {
  error?: string;
}

export async function saveVoiceProfile(
  answers: VoiceProfileAnswers,
): Promise<SaveResult> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const voiceProfile = {
    ...answers,
    completedAt: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('agents')
    .update({ voice_profile: voiceProfile, onboarding_completed: true })
    .eq('id', user.id);

  if (error) return { error: error.message };

  // Provision a dedicated Twilio number for this agent (no-op if already assigned)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  await provisionPhoneNumber(user.id, appUrl);
  // Non-fatal: if provisioning fails the agent still gets in, admin can retry later

  redirect('/leads');
}

// ─── Skip onboarding (sets a minimal placeholder voice_profile) ───────────────

export async function skipOnboarding(): Promise<SaveResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const placeholder = {
    communicationStyle: 'friendly',
    signaturePhrase:    '',
    differentiator:     '',
    marketArea:         '',
    sampleSentence:     '',
    skipped:            true,
    completedAt:        new Date().toISOString(),
  };

  const { error } = await supabase
    .from('agents')
    .update({ voice_profile: placeholder, onboarding_completed: false })
    .eq('id', user.id);

  if (error) return { error: error.message };

  // Provision a Twilio number even for skipped onboarding (no-op if already assigned)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  await provisionPhoneNumber(user.id, appUrl);

  redirect('/leads');
}
