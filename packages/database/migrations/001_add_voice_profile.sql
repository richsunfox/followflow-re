-- Migration 001: Add voice_profile JSONB column to agents table
-- Run this in your Supabase project's SQL Editor before using the onboarding quiz.

alter table agents
  add column if not exists voice_profile jsonb;

comment on column agents.voice_profile is
  'AI voice profile captured during onboarding. Stores communication style,
   signature phrase, differentiator, market area, and a sample message sentence.
   Used to personalise AI-generated follow-up messages to match the agent''s voice.';
