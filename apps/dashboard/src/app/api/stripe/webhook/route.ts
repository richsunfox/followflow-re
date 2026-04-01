import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

// Admin client — bypasses RLS to update subscription state from webhook
const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export async function POST(request: NextRequest) {
  const body      = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook signature invalid: ${msg}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'subscription') break;

      const userId       = session.metadata?.supabase_user_id;
      const subscriptionId = session.subscription as string;

      if (!userId) break;

      await supabaseAdmin
        .from('agents')
        .update({
          stripe_subscription_id: subscriptionId,
          subscription_status:    'active',
          is_active:              true,
        })
        .eq('id', userId);

      break;
    }

    case 'customer.subscription.updated': {
      const sub    = event.data.object as Stripe.Subscription;
      const userId = await getUserIdFromSubscription(sub);
      if (!userId) break;

      const isActive = sub.status === 'active';

      await supabaseAdmin
        .from('agents')
        .update({
          subscription_status: sub.status as string,
          is_active:           isActive,
        })
        .eq('stripe_subscription_id', sub.id);

      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;

      await supabaseAdmin
        .from('agents')
        .update({
          subscription_status: 'canceled',
          is_active:           false,
        })
        .eq('stripe_subscription_id', sub.id);

      break;
    }

    case 'invoice.payment_failed': {
      const invoice        = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;
      if (!subscriptionId) break;

      await supabaseAdmin
        .from('agents')
        .update({
          subscription_status: 'past_due',
          is_active:           false,
        })
        .eq('stripe_subscription_id', subscriptionId);

      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function getUserIdFromSubscription(sub: Stripe.Subscription): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('agents')
    .select('id')
    .eq('stripe_subscription_id', sub.id)
    .maybeSingle();
  return data?.id ?? null;
}
