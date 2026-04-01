import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

// $149/month, no trial. Set this to your actual Stripe Price ID.
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID!;

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
