-- ============================================================
-- FollowFlow RE — Supabase Database Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- AGENTS
-- One row per agent (linked to Supabase auth.users)
-- ============================================================
create table if not exists agents (
  id                     uuid primary key references auth.users(id) on delete cascade,
  email                  text not null unique,
  full_name              text not null,
  phone                  text,
  brokerage              text,
  license_number         text,
  subscription_tier      text not null default 'free' check (subscription_tier in ('free', 'pro', 'elite')),
  subscription_status    text not null default 'trialing' check (subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'paused')),
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  trial_ends_at          timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table agents enable row level security;

create policy "Agents can view own profile"
  on agents for select
  using (auth.uid() = id);

create policy "Agents can update own profile"
  on agents for update
  using (auth.uid() = id);

create policy "Agents can insert own profile"
  on agents for insert
  with check (auth.uid() = id);


-- ============================================================
-- LEADS
-- Potential buyers/sellers being nurtured by an agent
-- ============================================================
create table if not exists leads (
  id                 uuid primary key default uuid_generate_v4(),
  agent_id           uuid not null references agents(id) on delete cascade,
  first_name         text not null,
  last_name          text not null,
  email              text,
  phone              text,
  source             text check (source in (
                       'zillow', 'realtor_com', 'referral', 'open_house',
                       'social_media', 'website', 'cold_outreach', 'other'
                     )),
  lead_type          text not null default 'buyer' check (lead_type in ('buyer', 'seller', 'both')),
  status             text not null default 'new' check (status in (
                       'new', 'contacted', 'nurturing', 'hot', 'warm',
                       'cold', 'dead', 'converted'
                     )),
  priority           text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  budget_min         numeric(12,2),
  budget_max         numeric(12,2),
  desired_location   text,
  desired_bedrooms   int,
  desired_bathrooms  numeric(3,1),
  notes              text,
  tags               text[] default '{}',
  last_contacted_at  timestamptz,
  next_follow_up_at  timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table leads enable row level security;

create policy "Agents can manage own leads"
  on leads for all
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());

create index idx_leads_agent_id        on leads(agent_id);
create index idx_leads_status          on leads(agent_id, status);
create index idx_leads_next_follow_up  on leads(agent_id, next_follow_up_at) where next_follow_up_at is not null;
create index idx_leads_phone           on leads(phone) where phone is not null;
create index idx_leads_email           on leads(email) where email is not null;
create index idx_leads_created_at      on leads(agent_id, created_at desc);


-- ============================================================
-- MESSAGES (Outbound)
-- Every SMS or email sent TO a lead
-- ============================================================
create table if not exists messages (
  id                 uuid primary key default uuid_generate_v4(),
  agent_id           uuid not null references agents(id) on delete cascade,
  lead_id            uuid not null references leads(id) on delete cascade,
  channel            text not null check (channel in ('sms', 'email')),
  subject            text,                          -- email only
  body               text not null,
  status             text not null default 'pending' check (status in (
                       'pending', 'sent', 'delivered', 'failed', 'bounced'
                     )),
  ai_generated       boolean not null default false,
  provider_message_id text,                         -- Twilio SID or SendGrid message ID
  sent_at            timestamptz,
  error_message      text,
  created_at         timestamptz not null default now()
);

alter table messages enable row level security;

create policy "Agents can manage own messages"
  on messages for all
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());

create index idx_messages_agent_id   on messages(agent_id);
create index idx_messages_lead_id    on messages(lead_id);
create index idx_messages_status     on messages(agent_id, status);
create index idx_messages_created_at on messages(agent_id, created_at desc);


-- ============================================================
-- INBOUND_MESSAGES
-- Replies and inbound messages FROM leads (via Twilio/SendGrid webhooks)
-- ============================================================
create table if not exists inbound_messages (
  id            uuid primary key default uuid_generate_v4(),
  agent_id      uuid not null references agents(id) on delete cascade,
  lead_id       uuid references leads(id) on delete set null,   -- null if lead not yet matched
  channel       text not null check (channel in ('sms', 'email')),
  from_phone    text,
  from_email    text,
  subject       text,
  body          text not null,
  is_read       boolean not null default false,
  received_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

alter table inbound_messages enable row level security;

create policy "Agents can manage own inbound messages"
  on inbound_messages for all
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());

create index idx_inbound_agent_id    on inbound_messages(agent_id);
create index idx_inbound_lead_id     on inbound_messages(lead_id) where lead_id is not null;
create index idx_inbound_is_read     on inbound_messages(agent_id, is_read) where is_read = false;
create index idx_inbound_received_at on inbound_messages(agent_id, received_at desc);
create index idx_inbound_from_phone  on inbound_messages(from_phone) where from_phone is not null;


-- ============================================================
-- LISTINGS
-- Properties the agent is listing or showing
-- ============================================================
create table if not exists listings (
  id            uuid primary key default uuid_generate_v4(),
  agent_id      uuid not null references agents(id) on delete cascade,
  address       text not null,
  city          text not null,
  state         text not null,
  zip           text not null,
  price         numeric(12,2),
  bedrooms      int,
  bathrooms     numeric(3,1),
  sqft          int,
  lot_size      numeric(10,2),
  year_built    int,
  property_type text check (property_type in (
                  'single_family', 'condo', 'townhouse', 'multi_family',
                  'land', 'commercial', 'other'
                )),
  status        text not null default 'active' check (status in (
                  'coming_soon', 'active', 'under_contract', 'pending',
                  'sold', 'withdrawn', 'expired'
                )),
  mls_number    text,
  listing_date  date,
  closing_date  date,
  description   text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table listings enable row level security;

create policy "Agents can manage own listings"
  on listings for all
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());

create index idx_listings_agent_id  on listings(agent_id);
create index idx_listings_status    on listings(agent_id, status);
create index idx_listings_mls       on listings(mls_number) where mls_number is not null;


-- ============================================================
-- TRANSACTIONS
-- Active deals (buy-side, sell-side, or dual)
-- ============================================================
create table if not exists transactions (
  id                uuid primary key default uuid_generate_v4(),
  agent_id          uuid not null references agents(id) on delete cascade,
  lead_id           uuid references leads(id) on delete set null,
  listing_id        uuid references listings(id) on delete set null,
  transaction_type  text not null check (transaction_type in ('buy_side', 'sell_side', 'dual')),
  status            text not null default 'active' check (status in (
                      'active', 'under_contract', 'pending', 'closed',
                      'fallen_through', 'withdrawn'
                    )),
  address           text not null,
  city              text,
  state             text,
  zip               text,
  purchase_price    numeric(12,2),
  commission_rate   numeric(5,4),                    -- e.g. 0.0300 for 3%
  commission_amount numeric(12,2),
  closing_date      date,
  contract_date     date,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table transactions enable row level security;

create policy "Agents can manage own transactions"
  on transactions for all
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());

create index idx_transactions_agent_id    on transactions(agent_id);
create index idx_transactions_status      on transactions(agent_id, status);
create index idx_transactions_lead_id     on transactions(lead_id) where lead_id is not null;
create index idx_transactions_closing_date on transactions(agent_id, closing_date) where closing_date is not null;


-- ============================================================
-- TRANSACTION_UPDATES
-- Timeline of notes and status changes on a transaction
-- ============================================================
create table if not exists transaction_updates (
  id               uuid primary key default uuid_generate_v4(),
  agent_id         uuid not null references agents(id) on delete cascade,
  transaction_id   uuid not null references transactions(id) on delete cascade,
  update_type      text not null check (update_type in (
                     'status_change', 'note', 'document_uploaded',
                     'contingency_removed', 'inspection', 'appraisal',
                     'financing', 'closing', 'other'
                   )),
  note             text not null,
  created_at       timestamptz not null default now()
);

alter table transaction_updates enable row level security;

create policy "Agents can manage own transaction updates"
  on transaction_updates for all
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());

create index idx_tx_updates_agent_id       on transaction_updates(agent_id);
create index idx_tx_updates_transaction_id on transaction_updates(transaction_id);
create index idx_tx_updates_created_at     on transaction_updates(transaction_id, created_at desc);


-- ============================================================
-- PAST_CLIENTS
-- Closed clients for re-engagement, referral, and anniversary campaigns
-- ============================================================
create table if not exists past_clients (
  id                     uuid primary key default uuid_generate_v4(),
  agent_id               uuid not null references agents(id) on delete cascade,
  transaction_id         uuid references transactions(id) on delete set null,
  first_name             text not null,
  last_name              text not null,
  email                  text,
  phone                  text,
  property_address       text,
  closed_at              date,
  side                   text check (side in ('buyer', 'seller')),
  anniversary_followup   boolean not null default true,
  referral_count         int not null default 0,
  notes                  text,
  tags                   text[] default '{}',
  last_contacted_at      timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table past_clients enable row level security;

create policy "Agents can manage own past clients"
  on past_clients for all
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());

create index idx_past_clients_agent_id    on past_clients(agent_id);
create index idx_past_clients_closed_at   on past_clients(agent_id, closed_at);
create index idx_past_clients_phone       on past_clients(phone) where phone is not null;
create index idx_past_clients_email       on past_clients(email) where email is not null;
create index idx_past_clients_anniversary on past_clients(agent_id, anniversary_followup) where anniversary_followup = true;


-- ============================================================
-- AI_USAGE
-- Track every Claude API call for billing, quotas, and auditing
-- ============================================================
create table if not exists ai_usage (
  id            uuid primary key default uuid_generate_v4(),
  agent_id      uuid not null references agents(id) on delete cascade,
  lead_id       uuid references leads(id) on delete set null,
  model         text not null,
  prompt_type   text not null check (prompt_type in (
                  'lead_follow_up', 'sms_draft', 'email_draft',
                  'listing_description', 'market_update',
                  'past_client_outreach', 'inbound_reply_suggestion', 'other'
                )),
  input_tokens  int not null default 0,
  output_tokens int not null default 0,
  total_tokens  int not null generated always as (input_tokens + output_tokens) stored,
  cost_usd      numeric(10,6),
  created_at    timestamptz not null default now()
);

alter table ai_usage enable row level security;

create policy "Agents can view own AI usage"
  on ai_usage for select
  using (agent_id = auth.uid());

create policy "Service role can insert AI usage"
  on ai_usage for insert
  with check (agent_id = auth.uid());

create index idx_ai_usage_agent_id    on ai_usage(agent_id);
create index idx_ai_usage_created_at  on ai_usage(agent_id, created_at desc);
create index idx_ai_usage_prompt_type on ai_usage(agent_id, prompt_type);


-- ============================================================
-- UTILITY: updated_at auto-update trigger
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_agents
  before update on agents
  for each row execute function update_updated_at();

create trigger set_updated_at_leads
  before update on leads
  for each row execute function update_updated_at();

create trigger set_updated_at_listings
  before update on listings
  for each row execute function update_updated_at();

create trigger set_updated_at_transactions
  before update on transactions
  for each row execute function update_updated_at();

create trigger set_updated_at_past_clients
  before update on past_clients
  for each row execute function update_updated_at();
