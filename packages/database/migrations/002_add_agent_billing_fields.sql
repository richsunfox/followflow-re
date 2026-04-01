-- ============================================================
-- Migration 002: Add billing and lifecycle fields to agents
-- Run in Supabase SQL Editor
-- ============================================================

-- Drop the existing check constraint on subscription_status
-- (replacing 'trialing' default and the old enum values)
alter table agents
  drop constraint if exists agents_subscription_status_check;

-- Add new columns
alter table agents
  add column if not exists onboarding_completed   boolean   not null default false,
  add column if not exists is_active              boolean   not null default false,
  add column if not exists response_time_avg_minutes numeric  not null default 0;

-- Update subscription_status: change default from 'trialing' to 'pending'
-- and expand the allowed values to include 'pending'
alter table agents
  alter column subscription_status set default 'pending';

alter table agents
  add constraint agents_subscription_status_check
  check (subscription_status in ('pending', 'active', 'past_due', 'canceled', 'paused'));

-- Backfill existing rows: treat any 'trialing' rows as 'pending'
update agents set subscription_status = 'pending' where subscription_status = 'trialing';

-- Remove trial_ends_at (no longer using free trial model)
-- Kept as nullable — safe to drop once confirmed no data depends on it
-- alter table agents drop column if exists trial_ends_at;
