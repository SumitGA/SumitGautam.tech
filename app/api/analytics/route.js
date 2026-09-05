import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase";

/* Ingest for first-party analytics.
 *
 * Writes use the service role because analytics_events has no INSERT policy —
 * if the anon key could write, anyone with the (public) key could forge events
 * straight into the table. Routing every write through here keeps one place to
 * filter bots and strip anything identifying.
 *
 * Nothing that identifies a person is persisted. The IP address is read to
 * filter abuse and is never stored; the user agent is reduced to a device class
 * and a browser name and then discarded.
 *
 * This endpoint must never affect the visitor's experience, so every failure
 * path returns 204 rather than an error. A broken analytics table should cost
 * us data, not a working site.
 */

const EVENTS = new Set([
  "pageview",
  "contact_submit",
  "resume_print",
  "chat_open",
  "chat_message",
  "outbound_click",
  "case_study_view",
]);

const MAX_PATH = 512;
const MAX_ID = 64;

// Best-effort, per-instance. Serverless spreads requests across instances so
// this is not a hard cap — it exists to blunt a single client hammering the
// endpoint, not to be an authoritative limiter.
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 60_000;
const hits = new Map();

function rateLimited(key) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + RATE_WINDOW_MS });
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

const BOT = /bot|crawler|spider|crawling|slurp|bingpreview|headless|lighthouse|pagespeed|gtmetrix|curl|wget|python-requests|axios|node-fetch|monitoring|uptime|preview|facebookexternalhit|whatsapp|telegram|discord|slackbot/i;

function classify(ua) {
  if (!ua) return { device: "unknown", browser: "unknown" };
  const device = /tablet|ipad|playbook|silk/i.test(ua)
    ? "tablet"
    : /mobi|android|iphone|ipod|phone/i.test(ua)
      ? "mobile"
      : "desktop";
  // Order matters: Edge and Chrome both claim Safari, Edge also claims Chrome.
  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /opr\/|opera/i.test(ua)
      ? "Opera"
      : /firefox\//i.test(ua)
        ? "Firefox"
        : /chrome\/|crios/i.test(ua)
          ? "Chrome"
          : /safari\//i.test(ua)
            ? "Safari"
            : "Other";
  return { device, browser };
}

// Host only — a full referrer can carry query strings from someone else's site,
// and the host is all a dashboard can usefully group by.
function referrerHost(referrer, selfHost) {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return host && host !== selfHost?.replace(/^www\./, "") ? host.slice(0, 128) : null;
  } catch {
    return null;
  }
}

const str = (v, max) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

export async function POST(request) {
  try {
    const ua = request.headers.get("user-agent") || "";
    if (BOT.test(ua)) return new NextResponse(null, { status: 204 });

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (rateLimited(ip)) return new NextResponse(null, { status: 204 });

    const body = await request.json();

    const event = str(body.event, 64);
    const visitorId = str(body.visitorId, MAX_ID);
    const sessionId = str(body.sessionId, MAX_ID);
    if (!event || !EVENTS.has(event) || !visitorId || !sessionId) {
      return new NextResponse(null, { status: 204 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return new NextResponse(null, { status: 204 });

    const { device, browser } = classify(ua);

    // meta is free-form per event (which link was clicked, which case study),
    // but capped so a client cannot push arbitrary volume into the row.
    let meta = {};
    if (body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)) {
      for (const [k, v] of Object.entries(body.meta).slice(0, 10)) {
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          meta[String(k).slice(0, 40)] = typeof v === "string" ? v.slice(0, 200) : v;
        }
      }
    }

    const { error } = await supabase.from("analytics_events").insert({
      visitor_id: visitorId,
      session_id: sessionId,
      event,
      path: str(body.path, MAX_PATH),
      referrer_host: referrerHost(str(body.referrer, 1024), request.headers.get("host")),
      country: request.headers.get("x-vercel-ip-country") || null,
      device,
      browser,
      meta,
    });

    if (error) console.error("analytics insert failed:", error.message);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("analytics route error:", err?.message);
    return new NextResponse(null, { status: 204 });
  }
}
