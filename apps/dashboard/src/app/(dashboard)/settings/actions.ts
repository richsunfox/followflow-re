'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface UpdateProfileData {
  fullName:  string;
  brokerage: string;
  phone:     string;
}

export interface UpdateProfileResult {
  error?:   string;
  success?: boolean;
}

export async function updateProfile(
  data: UpdateProfileData,
): Promise<UpdateProfileResult> {
  if (!data.fullName.trim()) return { error: 'Name is required.' };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { error } = await supabase
    .from('agents')
    .update({
      full_name: data.fullName.trim(),
      brokerage: data.brokerage.trim() || null,
      phone:     data.phone.trim()     || null,
    })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/settings');
  return { success: true };
}
