import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _browser;
export function getSupabaseBrowser() {
  if (!_browser) _browser = createClient(url, anonKey);
  return _browser;
}

// Service-role client: bypasses RLS, server-side only
export function getSupabaseAdmin() {
  return createClient(url, serviceKey ?? anonKey);
}
