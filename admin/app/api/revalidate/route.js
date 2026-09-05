import { NextResponse } from "next/server";

/* Proxies a revalidation request to the portfolio.
 *
 * This exists so the shared secret stays server-side. If the admin's browser
 * called the portfolio directly the secret would have to ship to the client,
 * and it would be a cross-origin request needing CORS on the public site.
 */

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
let hits = [];

export async function POST() {
  const secret = process.env.REVALIDATE_SECRET;
  const target = process.env.PORTFOLIO_URL || "https://sumitgautam.tech";

  if (!secret) {
    // Not an error: the admin still works, edits just wait for the timer.
    return NextResponse.json({ revalidated: false, reason: "not configured" });
  }

  /* Best-effort throttle. The worst case here is forcing the site to rebuild
     repeatedly, which is a nuisance rather than a breach, so a per-instance
     counter is proportionate. */
  const now = Date.now();
  hits = hits.filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_LIMIT) {
    return NextResponse.json({ revalidated: false, reason: "rate limited" }, { status: 429 });
  }
  hits.push(now);

  try {
    const res = await fetch(`${target}/api/revalidate`, {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { revalidated: false, reason: `portfolio returned ${res.status}` },
        { status: 502 }
      );
    }
    return NextResponse.json({ revalidated: true });
  } catch (err) {
    return NextResponse.json({ revalidated: false, reason: err?.message }, { status: 502 });
  }
}
