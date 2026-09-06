/* Client-side helpers for uploading to Cloudinary from the editor.
 *
 * Posts store the returned `public_id`, never the URL — see
 * supabase/blog_schema.sql for why. */

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export function cloudinaryUrl(publicId, { width, height, crop = "fill" } = {}) {
  if (!publicId || !CLOUD) return null;
  const t = ["f_auto", "q_auto"];
  if (width) t.push(`w_${width}`);
  if (height) t.push(`h_${height}`);
  if (width || height) t.push(`c_${crop}`);
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${t.join(",")}/${publicId}`;
}

/* Uploads one file and resolves to { publicId, url, width, height }.
 * Cloudinary assigns the public_id, so two posts can both have a diagram.png
 * without colliding. */
export async function uploadImage(file, accessToken) {
  const signRes = await fetch("/api/cloudinary-sign", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!signRes.ok) {
    const body = await signRes.json().catch(() => ({}));
    throw new Error(body.error || `Could not sign upload (${signRes.status})`);
  }
  const { cloudName, apiKey, timestamp, folder, signature } = await signRes.json();

  // Must match the signed parameters exactly, or Cloudinary rejects it.
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("folder", folder);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message || "Upload failed");

  return {
    publicId: body.public_id,
    url: body.secure_url,
    width: body.width,
    height: body.height,
  };
}

/* Destroys images in Cloudinary. Called when a post is deleted — the database
   cascade removes the post_images rows, but Cloudinary has no idea the post is
   gone and would keep the files (and bill for them) forever. */
export async function deleteImages(publicIds, accessToken) {
  const ids = (publicIds || []).filter(Boolean);
  if (!ids.length) return { deleted: [] };

  const res = await fetch("/api/cloudinary-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ publicIds: ids }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Image cleanup failed (${res.status})`);
  return body;
}
