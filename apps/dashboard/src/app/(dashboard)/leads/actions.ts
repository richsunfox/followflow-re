'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface AddLeadData {
  firstName:       string;
  lastName:        string;
  email:           string;
  phone:           string;
  source:          string;
  leadType:        'buyer' | 'seller' | 'both';
  budgetMin:       string;
  budgetMax:       string;
  desiredLocation: string;
  desiredBedrooms: string;
  notes:           string;
}

export interface AddLeadResult {
  error?: string;
  success?: boolean;
}

export async function addLead(data: AddLeadData): Promise<AddLeadResult> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const budgetMin = data.budgetMin ? Number(data.budgetMin) : null;
  const budgetMax = data.budgetMax ? Number(data.budgetMax) : null;

  if (budgetMin !== null && isNaN(budgetMin)) return { error: 'Budget min must be a number' };
  if (budgetMax !== null && isNaN(budgetMax)) return { error: 'Budget max must be a number' };
  if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) {
    return { error: 'Budget min cannot exceed budget max' };
  }

  const desiredBedrooms = data.desiredBedrooms ? Number(data.desiredBedrooms) : null;
  if (desiredBedrooms !== null && (isNaN(desiredBedrooms) || desiredBedrooms < 0)) {
    return { error: 'Bedrooms must be a positive number' };
  }

  const { error } = await supabase.from('leads').insert({
    agent_id:          user.id,
    first_name:        data.firstName.trim(),
    last_name:         data.lastName.trim(),
    email:             data.email.trim()  || null,
    phone:             data.phone.trim()  || null,
    source:            data.source        || null,
    lead_type:         data.leadType,
    budget_min:        budgetMin,
    budget_max:        budgetMax,
    desired_location:  data.desiredLocation.trim() || null,
    desired_bedrooms:  desiredBedrooms,
    notes:             data.notes.trim()  || null,
    status:            'new',
    priority:          'medium',
    next_follow_up_at: new Date().toISOString(), // triggers worker on next tick
  });

  if (error) return { error: error.message };

  revalidatePath('/leads');
  return { success: true };
}

// ─── Update lead status ───────────────────────────────────────────────────────

export async function updateLeadStatus(
  leadId: string,
  status: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId)
    .eq('agent_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/leads');
  return { success: true };
}

// ─── Resume paused sequence ───────────────────────────────────────────────────

export async function resumeSequence(
  leadId: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('leads')
    .update({ sequence_paused: false })
    .eq('id', leadId)
    .eq('agent_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/leads');
  revalidatePath('/activity');
  return { success: true };
}
