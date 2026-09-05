import { getSupabaseAdmin } from "./supabase";

/* Per-IP rate limiting shared by the public API routes.
 *
 * Backed by Postgres rather than an in-memory counter: Vercel spreads requests
 * across instances, so a process-local Map limits each instance rather than
 * each caller, which is not a limit at all under the load that matters.
 *
 * See supabase/rate_limit.sql. One table keyed by (bucket, ip), so adding an
 * endpoint means passing a new bucket name rather than writing a migration.
 */

export function clientIp(req) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/* Returns true when the request may proceed.
 *
 * Fails OPEN. If Supabase is unreachable the endpoint keeps working unlimited,
 * which is the right trade here: an outage is rare and brief, while failing
 * closed would silently break the contact form — the site's primary
 * conversion — for every genuine visitor during it. The honeypot and the
 * length caps still apply either way, so this is not the only defence.
 */
export async function checkRateLimit(req, { bucket, limit, windowSeconds }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return true;

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_bucket: bucket,
    p_ip: clientIp(req),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error(`[rate-limit:${bucket}] check failed:`, error.message);
    return true;
  }
  return data !== false;
}
