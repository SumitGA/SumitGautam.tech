import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* Lists images already in the account, so an image can be re-used instead of
 * uploaded again.
 *
 * Without this the editor could only upload. Re-using a picture — a series
 * cover across every part, a diagram that belongs in two posts — meant
 * uploading a second copy, which quietly consumes storage and bandwidth on a
 * plan where both are finite, and leaves two public_ids for one image so a
 * later cleanup can only ever find half of it.
 *
 * The Admin API is used rather than a public delivery URL because there is no
 * public way to enumerate an account's assets — correctly, since that would
 * expose everything ever uploaded. Basic auth with key:secret, server-side
 * only, gated on a real Supabase session exactly like signing and deleting.
 */

const MAX_RESULTS = 100;

export async function GET(request) {
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

  const cursor = new URL(request.url).searchParams.get("cursor") || "";

  const params = new URLSearchParams({
    max_results: String(MAX_RESULTS),
    // Newest first: the image you want is almost always one you just uploaded.
    direction: "desc",
  });
  if (cursor) params.set("next_cursor", cursor);

  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  let res;
  try {
    res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?${params}`,
      {
        headers: { Authorization: `Basic ${credentials}` },
        signal: AbortSignal.timeout(10000),
      }
    );
  } catch {
    return NextResponse.json({ error: "Cloudinary did not respond." }, { status: 504 });
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: `Cloudinary returned ${res.status}.` },
      { status: 502 }
    );
  }

  const json = await res.json();

  /* Only what the picker needs. The Admin API response carries far more per
     asset — URLs with the cloud name baked in, tags, moderation state — and
     none of it should end up in the browser or, worse, in a post. */
  const images = (json.resources || []).map((r) => ({
    publicId: r.public_id,
    width: r.width,
    height: r.height,
    bytes: r.bytes,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ images, nextCursor: json.next_cursor || null });
}
