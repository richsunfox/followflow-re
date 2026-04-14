'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';

function adminClient() {
  return createAdmin(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export interface SignUpResult {
  error?:        string;
  needsConfirm?: boolean;
}

export async function signUp(
  fullName:  string,
  email:     string,
  password:  string,
  brokerage: string,
): Promise<SignUpResult> {
  if (!fullName.trim())  return { error: 'Full name is required.' };
  if (!email.trim())     return { error: 'Email is required.' };
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' };

  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return { error: error.message };

  const user = data.user;
  if (!user) return { error: 'Sign-up failed — please try again.' };

  // Create the agent row using the service role so RLS doesn't block it
  // (the user's cookie session may not be set yet at this point in SSR)
  const { error: insertError } = await adminClient()
    .from('agents')
    .insert({
      id:        user.id,
      email:     user.email!,
      full_name: fullName.trim(),
      brokerage: brokerage.trim() || null,
    });

  // Ignore duplicate — agent row may already exist if user re-submits
  if (insertError && !insertError.message.includes('duplicate')) {
    return { error: `Account created but profile save failed: ${insertError.message}` };
  }

  // If Supabase requires email confirmation there will be no session yet
  if (!data.session) {
    return { needsConfirm: true };
  }

  redirect('/onboarding');
}
