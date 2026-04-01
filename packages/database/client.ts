import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error('Missing env: SUPABASE_URL');
if (!supabaseAnonKey) throw new Error('Missing env: SUPABASE_ANON_KEY');
if (!supabaseServiceRoleKey) throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY');

/**
 * Public client — uses the anon key, respects Row Level Security.
 * Use this in any context where the caller is an authenticated agent
 * (e.g. dashboard API routes after verifying the session token).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
});

/**
 * Admin client — uses the service role key, bypasses Row Level Security.
 * Use this ONLY in trusted server-side contexts (workers, webhooks, cron jobs).
 * Never expose this client or its key to the browser.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
