'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export interface VoiceProfileAnswers {
  communicationStyle: string;  // 'formal' | 'casual' | 'friendly'
  signaturePhrase:    string;  // a word/phrase they use often
  differentiator:     string;  // what sets them apart
  marketArea:         string;  // their primary market area
  sampleSentence:     string;  // a real message they'd send a lead
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

  redirect('/leads');
}
