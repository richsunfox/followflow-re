-- ============================================================
-- Migration 003: Sequence tracking, listing content, inbound messages
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Leads: sequence tracking columns ─────────────────────────────────────────
alter table leads
  add column if not exists sequence_day       int     not null default 0,
  add column if not exists sequence_paused    boolean not null default false,
  add column if not exists sequence_completed boolean not null default false;

create index if not exists idx_leads_sequence
  on leads(agent_id, sequence_paused, sequence_completed, next_follow_up_at)
  where sequence_paused = false and sequence_completed = false;

-- Expand lead status to include 'replied'
alter table leads drop constraint if exists leads_status_check;
alter table leads add constraint leads_status_check check (status in (
  'new', 'contacted', 'nurturing', 'hot', 'warm',
  'cold', 'dead', 'converted', 'replied'
));

-- ── Messages: direction column (outbound vs inbound) ──────────────────────────
alter table messages
  add column if not exists direction text not null default 'outbound'
    check (direction in ('outbound', 'inbound'));

create index if not exists idx_messages_direction
  on messages(agent_id, direction, created_at desc);

-- ── Listings: AI-generated content columns ────────────────────────────────────
alter table listings
  add column if not exists key_features   text,
  add column if not exists agent_notes    text,
  add column if not exists social_caption text,
  add column if not exists email_subject  text,
  add column if not exists email_body     text;
