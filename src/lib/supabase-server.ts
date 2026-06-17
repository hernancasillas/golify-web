// Read-only Supabase client for Server Components.
// Anon key only — content pages render public, RLS-allowed data (stickers,
// public retas/quiniela metadata, etc). Never expose service role here.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
