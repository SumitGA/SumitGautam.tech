import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

/* Issues a short-lived signature so the browser can upload straight to
 * Cloudinary.
 *
 * The API secret never leaves the server. The browser receives only a
 * signature over the exact parameters it is allowed to send, so it cannot
 * upload to a different folder or with different options than we approved.
 *
 * Uploading direct to Cloudinary rather than proxying through here matters:
 * image bytes never pass through a serverless function, so there is no payload
 * limit and no execution time spent moving files.
 *
 * Access is gated on a real Supabase session. Without that this endpoint would
 * hand anyone the ability to upload into the account's storage and bandwidth.
 */

const FOLDER = "blog";

export async function POST(request) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 503 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const timestamp = Math.round(Date.now() / 1000);

  /* Cloudinary signs the alphabetically sorted, &-joined parameter list with
     the secret appended. Whatever is signed here is exactly what the browser
     must send — any extra or altered parameter invalidates it, which is what
     stops a signature being reused for a different upload. */
  const params = { folder: FOLDER, timestamp };
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + apiSecret).digest("hex");

  return NextResponse.json({ cloudName, apiKey, timestamp, folder: FOLDER, signature });
}
