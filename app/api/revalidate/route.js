import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createHash, timingSafeEqual } from "node:crypto";

/* On-demand cache invalidation, called by the admin panel after a save.
 *
 * Pages are statically generated (see the root layout), so without this a CMS
 * edit would not appear until the revalidate window expired. That window is
 * deliberately long — this endpoint, not the timer, is what makes edits
 * appear, and the timer is only a safety net for when a push is missed.
 *
 * The secret is required. Without it anyone could force repeated regeneration,
 * which is a cheap way to make the site do expensive work.
 */

function sameSecret(a, b) {
  // Hash first so the comparison operates on equal-length buffers —
  // timingSafeEqual throws otherwise, and the length itself would leak.
  const ha = createHash("sha256").update(String(a)).digest();
  const hb = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

export async function POST(request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Revalidation not configured." }, { status: 503 });
  }

  const provided = request.headers.get("x-revalidate-secret");
  if (!provided || !sameSecret(provided, secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Everything the CMS drives sits under the root layout, and the site is a
  // handful of pages — invalidating the lot is simpler and less error-prone
  // than mapping each admin section to the routes it affects.
  revalidatePath("/", "layout");

  return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}
