import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Singleton for browser usage (client components)
let _browser;
export function getSupabaseBrowser() {
  if (!_browser) _browser = createClient(url, anonKey);
  return _browser;
}

// Fresh client for server usage (server components, no singleton needed)
export function getSupabaseServer() {
  return createClient(url, anonKey);
}

// Service-role client — server-only, bypasses RLS. Env is read lazily so this
// never runs at module-eval time during the build.
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !serviceKey) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: { persistSession: false },
  });
}
