# FollowFlow RE

AI-powered lead follow-up automation for solo California real estate agents. Sends personalized SMS and email follow-ups in the agent's own voice, automatically, across a 14-day sequence. Includes a listing description writer, inbound reply handling, response-time analytics, and a full lead pipeline dashboard.

**Price:** $149/month, no trial, month-to-month.  
**Target user:** Solo agents in California who lose leads to slow follow-up.  
**Stack:** Next.js 14 (App Router) · TypeScript · Supabase (Postgres + Auth) · Twilio (SMS) · SendGrid (Email) · Stripe (billing) · Anthropic Claude Sonnet 4.6 (AI)

---

## Table of Contents

1. [Folder Structure](#folder-structure)
2. [Pages & Routes](#pages--routes)
3. [Environment Variables](#environment-variables)
4. [Running Locally](#running-locally)
5. [Build Status — What's Done vs Needs Work](#build-status)
6. [Database Tables](#database-tables)
7. [Key Architectural Decisions](#key-architectural-decisions)

---

## Folder Structure

```
followflow-re/
├── apps/
│   ├── dashboard/                          # Next.js 14 app (main product)
│   │   ├── middleware.ts                   # Auth gate + session refresh + pathname header
│   │   ├── .env.local                      # All env vars for the dashboard app
│   │   └── src/
│   │       ├── app/
│   │       │   ├── globals.css             # Tailwind base + custom animations (fade-slide, nav-progress)
│   │       │   ├── layout.tsx              # Root HTML shell, font, metadata
│   │       │   ├── page.tsx                # Root redirect → /leads
│   │       │   │
│   │       │   ├── (dashboard)/            # Auth-gated route group — all pages here require login
│   │       │   │   ├── layout.tsx          # Checks auth, subscription gate, onboarding gate; renders Sidebar
│   │       │   │   │
│   │       │   │   ├── leads/
│   │       │   │   │   ├── page.tsx        # Lead pipeline page — fetches leads + messages, computes response-time stats
│   │       │   │   │   ├── actions.ts      # addLead, updateLeadStatus, resumeSequence server actions
│   │       │   │   │   └── loading.tsx     # Skeleton UI shown while page fetches data
│   │       │   │   │
│   │       │   │   ├── listings/
│   │       │   │   │   ├── page.tsx        # Listing writer page shell — fetches history, renders form
│   │       │   │   │   ├── ListingsForm.tsx # Client component — form, AI generation, output cards, history
│   │       │   │   │   └── actions.ts      # generateListingContent (Claude API call + DB save), getListingHistory
│   │       │   │   │
│   │       │   │   ├── activity/
│   │       │   │   │   ├── page.tsx        # Activity feed — merges messages + inbound_messages, computes stats
│   │       │   │   │   └── loading.tsx     # Skeleton UI shown while page fetches data
│   │       │   │   │
│   │       │   │   ├── settings/
│   │       │   │   │   └── page.tsx        # Account info, voice profile summary, billing link
│   │       │   │   │
│   │       │   │   ├── billing/
│   │       │   │   │   └── page.tsx        # Subscription paywall — shown to inactive agents; triggers Stripe checkout
│   │       │   │   │
│   │       │   │   └── onboarding/
│   │       │   │       ├── page.tsx        # 5-step voice profile wizard (skippable)
│   │       │   │       └── actions.ts      # saveVoiceProfile, skipOnboarding server actions
│   │       │   │
│   │       │   ├── api/
│   │       │   │   ├── stripe/
│   │       │   │   │   ├── checkout/
│   │       │   │   │   │   └── route.ts    # POST — creates Stripe Checkout session, returns redirect URL
│   │       │   │   │   └── webhook/
│   │       │   │   │       └── route.ts    # POST — handles checkout.session.completed, subscription.updated/deleted, payment_failed
│   │       │   │   └── webhooks/
│   │       │   │       └── twilio/
│   │       │   │           └── route.ts    # POST — receives inbound SMS, matches lead, pauses sequence, emails agent
│   │       │   │
│   │       │   ├── login/
│   │       │   │   └── page.tsx            # Sign-in form + forgot-password flow (Supabase auth)
│   │       │   │
│   │       │   └── landing/
│   │       │       └── page.tsx            # Public marketing page — hero, features, comparison table, pricing, FAQ
│   │       │
│   │       ├── components/
│   │       │   ├── Sidebar.tsx             # Dark sidebar nav — Leads, Listing Writer, Activity, Settings, Billing
│   │       │   ├── LeadsTable.tsx          # Filterable, sortable, paginated lead table with clickable rows
│   │       │   ├── LeadDetailModal.tsx     # Right-side drawer — shows full lead info + inline status editor
│   │       │   ├── AddLeadModal.tsx        # Modal form to manually add a lead
│   │       │   ├── ActivityList.tsx        # Activity feed list — filters, lead search, pagination, resume-sequence button
│   │       │   ├── ResponseTimeWidget.tsx  # Indigo widget showing avg response time, week-over-week delta, 5-min rate
│   │       │   └── NavigationProgress.tsx  # Thin indigo top bar that animates on internal link clicks
│   │       │
│   │       └── lib/
│   │           ├── stripe.ts               # Stripe client instance + STRIPE_PRICE_ID + STRIPE_WEBHOOK_SECRET exports
│   │           └── supabase/
│   │               ├── client.ts           # Supabase browser client (used in Client Components)
│   │               └── server.ts           # Supabase server client with cookie handling (used in Server Components + actions)
│   │
│   └── worker/
│       ├── scheduler.ts                    # Cron runner (every 15 min) — finds eligible leads, generates messages, updates sequence state
│       └── sequence.ts                     # 7-step, 14-day follow-up sequence definition with per-step prompts
│
├── packages/
│   ├── database/
│   │   ├── schema.sql                      # Full Supabase schema — all tables, RLS policies, indexes, triggers
│   │   └── migrations/
│   │       ├── 001_add_voice_profile.sql   # Adds voice_profile JSONB column to agents
│   │       ├── 002_add_agent_billing_fields.sql  # Adds onboarding_completed, is_active, response_time_avg_minutes; replaces 'trialing' status
│   │       └── 003_sequence_and_content_fields.sql  # Adds sequence tracking to leads, direction to messages, content columns to listings
│   │
│   └── ai-engine/
│       ├── generate.ts                     # Core AI generation functions: generateSMS(), generateEmail()
│       └── prompts/
│           ├── follow-up-text.ts           # System prompt for SMS follow-ups (voice-matched, step-aware)
│           ├── follow-up-email.ts          # System prompt for email follow-ups
│           ├── listing-description.ts      # System prompt for MLS copy + social caption + just-listed email
│           ├── breakup-message.ts          # System prompt for day-14 final message
│           └── transaction-update.ts       # System prompt for escrow milestone client messages
│
├── .env.local                              # Root env vars (used by worker; Anthropic, Supabase, Twilio, SendGrid)
└── README.md
```

---

## Pages & Routes

### Public

| Route | What it does |
|---|---|
| `/landing` | Marketing page. Hero, feature grid, competitor comparison table, pricing section, FAQ accordion, CTAs. No auth required. |
| `/login` | Sign-in form + forgot-password flow. Successful login redirects to `/leads`. Already-logged-in users are redirected to `/leads` by middleware. |

### Auth-Gated Dashboard

All routes under `/(dashboard)/` require an authenticated session. The layout enforces two gates in sequence:

1. **Subscription gate** — if `agent.is_active = false`, redirect to `/billing` (except on `/billing` itself)
2. **Onboarding gate** — if active but `agent.voice_profile` is null, redirect to `/onboarding` (except on `/onboarding` itself)

| Route | What it does |
|---|---|
| `/leads` | Primary dashboard. Shows response-time widget, 4 stat cards (Hot/Warm/Nurturing/Overdue), and a full lead table. Table supports status tab filters, full-text search, sorting by Score/Last Contact/Next Follow-up, 20-per-page pagination, and row-click to open the lead detail drawer. |
| `/listings` | AI listing writer. Two-column layout: form on left, generated outputs on right. Generates MLS description (150–200 words), Instagram caption (<150 chars + hashtags), and a just-listed email in one Claude API call. History panel shows last 10 listings with expandable content. |
| `/activity` | 30-day message feed. Merges outbound `messages` and inbound `inbound_messages` into one unified timeline. Filters: All / SMS / Email / Replies. Per-lead name search. Expanding a reply row shows a "Resume sequence" button. |
| `/settings` | Account info, full voice profile summary, and a link to billing. "Edit" link re-opens onboarding wizard. |
| `/billing` | Subscription paywall for inactive agents. Shows plan details ($149/mo), triggers Stripe Checkout via `POST /api/stripe/checkout`. Active agents can access this page from the sidebar to view plan status. |
| `/onboarding` | 5-step wizard to capture the agent's communication style, signature phrase, differentiator, market area, and a sample message. Animated step transitions. Skippable at any step via "Skip for now" (saves a placeholder voice_profile). |

### API Routes

| Route | Method | What it does |
|---|---|---|
| `/api/stripe/checkout` | POST | Creates a Stripe Checkout Session for the $149/mo plan. Reuses existing Stripe customer ID or creates one. Returns `{ url }` for client-side redirect. |
| `/api/stripe/webhook` | POST | Validates Stripe signature. Handles `checkout.session.completed` (activates account), `customer.subscription.updated` (syncs status), `customer.subscription.deleted` (cancels), `invoice.payment_failed` (marks past_due). |
| `/api/webhooks/twilio` | POST | Receives inbound SMS from Twilio. Validates signature. Matches sender phone to a lead. Logs to `messages` table. Sets `lead.status = 'replied'` and `sequence_paused = true`. Sends an HTML notification email to the agent via SendGrid. Returns empty TwiML. |

---

## Environment Variables

Both `.env.local` files must be populated. The root `.env.local` is used by the worker; `apps/dashboard/.env.local` is used by the Next.js app.

### `apps/dashboard/.env.local`

| Variable | Required | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase dashboard → Project Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase dashboard → Project Settings → API → service_role key (keep secret) |
| `ANTHROPIC_API_KEY` | Yes | console.anthropic.com → API Keys |
| `STRIPE_SECRET_KEY` | Yes | Stripe dashboard → Developers → API keys → Secret key (`sk_test_…` or `sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe dashboard → Developers → Webhooks → your endpoint → Signing secret (`whsec_…`) |
| `STRIPE_PRICE_ID` | Yes | Stripe dashboard → Products → FollowFlow RE → price ID (`price_…`) |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` locally; your production domain in prod |
| `TWILIO_AUTH_TOKEN` | Yes | Twilio Console → Account Info → Auth Token |
| `TWILIO_PHONE_NUMBER` | Yes | Twilio Console → Phone Numbers → your number (E.164 format: `+15551234567`) |
| `SENDGRID_API_KEY` | Yes | SendGrid → Settings → API Keys → Create API Key (Full Access) |
| `SENDGRID_FROM_EMAIL` | Yes | SendGrid → Settings → Sender Authentication → verified sender email |

### Root `.env.local` (used by worker)

Same variables as above minus the `NEXT_PUBLIC_` prefixed ones, plus:

| Variable | Required | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Same as above |
| `SUPABASE_URL` | Yes | Same project URL (no `NEXT_PUBLIC_` prefix for worker) |
| `SUPABASE_ANON_KEY` | Yes | Same anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Same service role key |
| `TWILIO_ACCOUNT_SID` | Yes | Twilio Console → Account Info → Account SID |
| `TWILIO_AUTH_TOKEN` | Yes | Twilio Console → Account Info → Auth Token |
| `TWILIO_PHONE_NUMBER` | Yes | Same as above |
| `SENDGRID_API_KEY` | Yes | Same as above |

### Stripe webhook events to register

When creating the webhook endpoint in the Stripe dashboard, subscribe to exactly these four events:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Endpoint URL: `https://yourdomain.com/api/stripe/webhook`

---

## Running Locally

### Prerequisites

- Node.js 18+
- A Supabase project (free tier is fine)
- npm

### 1. Clone and install

```bash
git clone <repo>
cd followflow-re/apps/dashboard
npm install --cache /tmp/npm-cache
```

> **Note:** Always use `--cache /tmp/npm-cache` — the default npm cache path has permission issues on this machine.

### 2. Set up the database

In the Supabase SQL Editor, run these files in order:

1. `packages/database/schema.sql` — creates all tables, RLS policies, indexes, triggers
2. `packages/database/migrations/001_add_voice_profile.sql`
3. `packages/database/migrations/002_add_agent_billing_fields.sql`
4. `packages/database/migrations/003_sequence_and_content_fields.sql`

### 3. Configure environment variables

Copy the template and fill in all values:

```bash
cp apps/dashboard/.env.local.example apps/dashboard/.env.local
# Edit apps/dashboard/.env.local with your actual keys
```

Minimum required to run locally (bypassing billing):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` to any non-empty placeholder to prevent startup crashes (the billing flow won't work but the rest of the app will)

### 4. Create an agent account

Supabase doesn't auto-create a row in `agents` on signup. After creating a user in Supabase Auth (or via the login page), manually insert a row:

```sql
insert into agents (id, email, full_name, subscription_status, is_active)
values (
  '<your-auth-user-uuid>',
  'you@example.com',
  'Your Name',
  'active',   -- skip billing gate
  true        -- skip subscription gate
);
```

### 5. Start the dev server

```bash
cd apps/dashboard
npm run dev
```

App runs at **http://localhost:3000**

### 6. Run the worker (optional)

The follow-up scheduler is a standalone Node.js process, not part of the Next.js app:

```bash
cd apps/worker
npx ts-node scheduler.ts
```

In production this should run as a cron job every 15 minutes (`*/15 * * * *`).

---

## Build Status

### Fully Built

| Feature | Status | Notes |
|---|---|---|
| Authentication (login/logout/session) | Done | Supabase Auth, middleware-level session refresh |
| Onboarding wizard | Done | 5 steps, animated, skippable |
| Lead pipeline dashboard | Done | Table with filters, sort, pagination, stat cards |
| Lead detail drawer | Done | Full info view + inline status editor |
| Add lead modal | Done | Manual entry with validation |
| Response time analytics | Done | Week-over-week delta, 5-min rate, leads-this-month |
| AI listing description writer | Done | MLS + Instagram + just-listed email in one call |
| 14-day follow-up sequence engine | Done | 7 steps, SMS + email, worker/scheduler.ts |
| Inbound SMS webhook | Done | Twilio signature validation, lead match, sequence pause, agent email |
| Activity feed | Done | 30-day feed, per-lead filter, tab filters, resume-sequence button |
| Settings page | Done | Voice profile display, billing link, account info |
| Billing page UI | Done | Plan details, Stripe Checkout trigger |
| Stripe webhook handler | Done | Handles all 4 subscription lifecycle events |
| Landing/marketing page | Done | Hero, features, comparison, pricing, FAQ |
| Navigation progress bar | Done | Thin indigo bar on internal link clicks |
| Skeleton loading states | Done | /leads and /activity have full skeletons |
| Forgot password flow | Done | Supabase reset email |
| Sidebar Settings + Billing links | Done | |

### Needs Work / Not Yet Wired

| Feature | Status | Notes |
|---|---|---|
| Twilio SMS sending | Not wired | `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` not configured; messages insert to DB with `status='pending'` but are not actually sent |
| SendGrid email sending | Not wired | `SENDGRID_API_KEY` not configured; same as above |
| Stripe billing | Not wired | Env vars not set; checkout will error; manually set `is_active=true` in DB to bypass |
| Worker deployment | Not deployed | `apps/worker/scheduler.ts` runs locally with `ts-node`; needs cron host (Railway, Render, EC2, etc.) |
| Lead editing | Partial | Status editable from detail drawer; contact info, notes, budget are display-only — no edit form |
| CSV lead import | Not started | Landing page mentions it; no UI or backend exists |
| Billing management | Not started | Active subscribers can see plan status but cannot cancel or update payment method from within the app |
| Transaction milestone messages | Not started | `transaction-update.ts` prompt exists; no UI or route |
| Past client re-engagement | Not started | `past_clients` table exists in schema; no UI |
| In-app notifications | Not started | No push or in-app alert system |
| Dark mode | Not started | Login + landing use dark themes; dashboard is light-only |
| Lead notes editing | Not started | Notes display in detail drawer but are not editable |
| Email/password sign-up | Not started | Only sign-in exists; new agents must be created manually in Supabase or via a to-be-built sign-up flow |

---

## Database Tables

All tables use Supabase Postgres with Row Level Security (RLS). Every table is scoped to `agent_id = auth.uid()`. The service role key bypasses RLS for webhook handlers and the worker.

### `agents`

One row per agent. Linked to `auth.users` by primary key.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Matches Supabase `auth.users.id` |
| `email` | text | Agent's email |
| `full_name` | text | Display name, shown in sidebar |
| `phone` | text | Agent's personal phone (optional) |
| `brokerage` | text | Brokerage name (optional) |
| `license_number` | text | CA DRE license (optional) |
| `voice_profile` | jsonb | AI voice config: `{ communicationStyle, signaturePhrase, differentiator, marketArea, sampleSentence, completedAt, skipped? }` |
| `onboarding_completed` | boolean | True when voice profile was fully completed (not skipped) |
| `is_active` | boolean | True when subscription is active — used as the billing gate |
| `subscription_status` | text | `pending` / `active` / `past_due` / `canceled` / `paused` |
| `stripe_customer_id` | text | Stripe customer ID (`cus_…`) |
| `stripe_subscription_id` | text | Stripe subscription ID (`sub_…`) |
| `response_time_avg_minutes` | numeric | Computed average response time (updated by worker or analytics) |

### `leads`

One row per lead per agent.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `agent_id` | uuid | FK → agents |
| `first_name`, `last_name` | text | Lead's name |
| `email`, `phone` | text | Contact info — used to match inbound SMS/email |
| `source` | text | `zillow` / `realtor_com` / `referral` / `open_house` / `social_media` / `website` / `cold_outreach` / `other` |
| `lead_type` | text | `buyer` / `seller` / `both` |
| `status` | text | `new` / `contacted` / `nurturing` / `hot` / `warm` / `cold` / `dead` / `converted` / `replied` |
| `priority` | text | `high` / `medium` / `low` — affects lead score |
| `budget_min`, `budget_max` | numeric | Buyer budget range |
| `notes` | text | Agent's private notes |
| `last_contacted_at` | timestamptz | Updated when a message is sent |
| `next_follow_up_at` | timestamptz | Scheduler uses this to determine when to fire next step |
| `sequence_day` | int | Which step (0–6) the lead is on in the 7-step sequence |
| `sequence_paused` | boolean | True when lead has replied — scheduler skips paused leads |
| `sequence_completed` | boolean | True when all 7 steps have been sent |

### `messages`

Every outbound message sent to a lead (plus inbound messages logged by the Twilio webhook).

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `agent_id`, `lead_id` | uuid | FKs |
| `channel` | text | `sms` / `email` |
| `direction` | text | `outbound` / `inbound` — inbound set when Twilio webhook logs a reply |
| `subject` | text | Email subject line (null for SMS) |
| `body` | text | Full message content |
| `status` | text | `pending` / `sent` / `delivered` / `failed` / `bounced` |
| `ai_generated` | boolean | True for sequence messages; false for manual/inbound |
| `provider_message_id` | text | Twilio SID or SendGrid message ID |
| `sent_at` | timestamptz | Null until delivery is confirmed |

### `inbound_messages`

Dedicated table for lead replies received via Twilio/SendGrid webhooks.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `agent_id`, `lead_id` | uuid | FKs — `lead_id` can be null if phone not matched |
| `channel` | text | `sms` / `email` |
| `from_phone`, `from_email` | text | Sender contact info |
| `subject`, `body` | text | Message content |
| `is_read` | boolean | For future unread-count badge |
| `received_at` | timestamptz | When Twilio/SendGrid delivered it |

### `listings`

Properties for the listing description writer.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `agent_id` | uuid | FK → agents |
| `address`, `city`, `state`, `zip` | text | Property location |
| `price` | numeric | List price |
| `bedrooms`, `bathrooms`, `sqft` | numeric/int | Property specs |
| `property_type` | text | `single_family` / `condo` / `townhouse` / `multi_family` / `land` / `other` |
| `key_features` | text | Comma-separated features from form (private, informs AI) |
| `agent_notes` | text | Private agent context (never published verbatim) |
| `description` | text | AI-generated MLS description |
| `social_caption` | text | AI-generated Instagram caption |
| `email_subject` | text | AI-generated just-listed email subject |
| `email_body` | text | AI-generated just-listed email body |
| `status` | text | `active` / `under_contract` / `sold` / etc. |

### `ai_usage`

Tracks every Claude API call for cost monitoring and auditing.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `agent_id`, `lead_id` | uuid | FKs |
| `model` | text | e.g. `claude-sonnet-4-6` |
| `prompt_type` | text | `lead_follow_up` / `sms_draft` / `email_draft` / `listing_description` / etc. |
| `input_tokens`, `output_tokens` | int | Token counts from API response |
| `total_tokens` | int | Generated column (`input + output`) |
| `cost_usd` | numeric | Estimated cost in USD |

### `transactions` and `transaction_updates`

Schema exists for tracking active deals and their timeline, but no UI has been built yet. See `packages/ai-engine/prompts/transaction-update.ts` for the planned AI prompt.

### `past_clients`

Schema exists for closed-client re-engagement campaigns (anniversary follow-ups, referral asks). No UI built yet.

---

## Key Architectural Decisions

**Auth flow:** Supabase Auth handles sessions. `middleware.ts` refreshes the session on every request and redirects unauthenticated users to `/login`. The dashboard `layout.tsx` enforces subscription and onboarding gates server-side using the agent's `is_active` and `voice_profile` fields.

**Billing gate bypass:** During development, set `is_active = true` directly in the `agents` table. This bypasses both the Stripe requirement and any subscription logic.

**Worker is separate from the web app:** `apps/worker/scheduler.ts` is a standalone Node.js process that must be run independently on a cron schedule. It uses the service role key to bypass RLS and process all agents' leads. It is not invoked by the Next.js app.

**Messages flow:** The worker generates messages and inserts them with `status = 'pending'`. A separate delivery layer (not yet built) should pick up pending messages and send them via Twilio/SendGrid, then update the status. Currently messages sit in the DB as `pending` indefinitely until the delivery integration is wired.

**AI voice matching:** The `voice_profile` JSON object is passed into every AI prompt by the worker. Prompts are in `packages/ai-engine/prompts/`. If `voice_profile.skipped = true`, prompts fall back to a generic friendly tone.

**Inbound SMS → sequence pause:** The Twilio webhook at `/api/webhooks/twilio` receives inbound SMS, finds the lead by phone number (exact match, then last-10-digits fallback), sets `sequence_paused = true` on the lead, and emails the agent. The scheduler checks `sequence_paused` before every send and skips paused leads.

**Label style standard:** All form field labels across the dashboard use `text-xs font-semibold text-gray-500 uppercase tracking-wide` — do not deviate.

**npm install:** Always use `npm install --cache /tmp/npm-cache` — the default cache path has permission errors on the dev machine.
