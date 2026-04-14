import Stripe from 'stripe';

// Guard against missing key — Stripe constructor throws immediately if key is empty.
// Billing routes will error gracefully if STRIPE_SECRET_KEY is not configured.
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' })
  : null as unknown as Stripe;

// $149/month, no trial. Set this to your actual Stripe Price ID.
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID!;

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
