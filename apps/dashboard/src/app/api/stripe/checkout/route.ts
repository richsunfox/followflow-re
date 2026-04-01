'use server';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, STRIPE_PRICE_ID } from '@/lib/stripe';

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  // Fetch or reuse existing Stripe customer ID
  const { data: agent } = await supabase
    .from('agents')
    .select('stripe_customer_id, email, full_name')
    .eq('id', user.id)
    .maybeSingle();

  let customerId = agent?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: agent?.email ?? user.email ?? undefined,
      name:  agent?.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await supabase
      .from('agents')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer:             customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price:    STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    mode:                'subscription',
    subscription_data:   { trial_period_days: 0 },
    success_url:         `${baseUrl}/leads?checkout=success`,
    cancel_url:          `${baseUrl}/billing`,
    metadata:            { supabase_user_id: user.id },
  });

  return NextResponse.json({ url: session.url });
}
