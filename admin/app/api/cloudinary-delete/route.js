import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* Removes images from Cloudinary when the post that owns them is deleted.
 *
 * Without this, deleting a post orphans its images: they keep consuming
 * storage and stay publicly reachable at their URL forever, with nothing left
 * in the database pointing at them. post_images exists precisely so they
 * remain enumerable at the moment of deletion.
 *
 * Uses the Admin API rather than the per-image destroy endpoint so a post with
 * a dozen images is one request. Basic auth with key:secret, server-side only.
 */

const MAX_PER_CALL = 100; // Cloudinary's documented limit for this endpoint.

export async function POST(request) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 503 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data: auth, error: authError } = await supabase.auth.getUser(token);
  if (authError || !auth?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { publicIds } = await request.json().catch(() => ({}));
  const ids = (Array.isArray(publicIds) ? publicIds : [])
    .filter((id) => typeof id === "string" && id.trim())
    .slice(0, MAX_PER_CALL);

  if (!ids.length) return NextResponse.json({ deleted: [], skipped: [] });

  const params = new URLSearchParams();
  for (const id of ids) params.append("public_ids[]", id);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?${params}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
      },
    }
  );

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: body?.error?.message || `Cloudinary returned ${res.status}` },
      { status: 502 }
    );
  }

  // `deleted` maps each id to "deleted" or "not_found".
  const deleted = Object.entries(body.deleted || {})
    .filter(([, state]) => state === "deleted")
    .map(([id]) => id);

  return NextResponse.json({ deleted, requested: ids.length });
}
