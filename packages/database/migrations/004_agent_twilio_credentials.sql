-- ============================================================
-- Migration 004: Assigned Twilio phone number per agent
-- Run in Supabase SQL Editor
-- ============================================================
-- FollowFlow RE owns one Twilio account. Each agent is assigned
-- a dedicated phone number from our pool. Credentials (Account SID
-- and Auth Token) are stored in the app's environment variables,
-- never per-agent.

alter table agents
  add column if not exists twilio_phone_number text unique;
