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
