import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './supabase-config.js';

function hasRealValue(value, placeholder) {
  return Boolean(value) && value !== placeholder && !String(value).includes('YOUR_');
}

export const isSupabaseConfigured =
  hasRealValue(SUPABASE_URL, 'https://YOUR_PROJECT_ID.supabase.co') &&
  hasRealValue(SUPABASE_PUBLISHABLE_KEY, 'YOUR_PUBLISHABLE_OR_LEGACY_ANON_KEY');

let clientPromise = null;

export async function getSupabaseClient() {
  if (!isSupabaseConfigured) return null;
  if (!clientPromise) {
    clientPromise = import('https://esm.sh/@supabase/supabase-js@2')
      .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY));
  }
  return clientPromise;
}
