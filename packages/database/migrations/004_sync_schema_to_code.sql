-- ============================================================
-- Migration 004 — Sync schema to code
-- Safe to run multiple times (ADD COLUMN IF NOT EXISTS)
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- AGENTS
-- ────────────────────────────────────────────────────────────

alter table agents
  add column if not exists voice_profile              jsonb,
  add column if not exists onboarding_completed       boolean not null default false,
  add column if not exists is_active                  boolean not null default false,
  add column if not exists response_time_avg_minutes  numeric,
  add column if not exists twilio_phone_number        text;

-- Unique constraint on twilio_phone_number (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'agents_twilio_phone_number_key'
      and conrelid = 'agents'::regclass
  ) then
    alter table agents add constraint agents_twilio_phone_number_key unique (twilio_phone_number);
  end if;
end$$;

-- Expand subscription_status to include 'pending'
alter table agents drop constraint if exists agents_subscription_status_check;
alter table agents
  add constraint agents_subscription_status_check
  check (subscription_status in ('pending', 'trialing', 'active', 'past_due', 'canceled', 'paused'));


-- ────────────────────────────────────────────────────────────
-- LEADS
-- ────────────────────────────────────────────────────────────

alter table leads
  add column if not exists sequence_day       int     not null default 0,
  add column if not exists sequence_paused    boolean not null default false,
  add column if not exists sequence_completed boolean not null default false;

-- Expand status to include 'replied'
alter table leads drop constraint if exists leads_status_check;
alter table leads
  add constraint leads_status_check
  check (status in ('new', 'contacted', 'nurturing', 'hot', 'warm', 'cold', 'dead', 'converted', 'replied'));


-- ────────────────────────────────────────────────────────────
-- MESSAGES
-- ────────────────────────────────────────────────────────────

alter table messages
  add column if not exists direction text not null default 'outbound'
    check (direction in ('outbound', 'inbound'));


-- ────────────────────────────────────────────────────────────
-- LISTINGS
-- ────────────────────────────────────────────────────────────

alter table listings
  add column if not exists key_features   text,
  add column if not exists agent_notes    text,
  add column if not exists social_caption text,
  add column if not exists email_subject  text,
  add column if not exists email_body     text;


-- ────────────────────────────────────────────────────────────
-- AI_USAGE — fix insert policy so worker (service role) can
-- insert rows on behalf of any agent
-- ────────────────────────────────────────────────────────────

drop policy if exists "Service role can insert AI usage" on ai_usage;

create policy "Service role can insert AI usage"
  on ai_usage for insert
  with check (true);
