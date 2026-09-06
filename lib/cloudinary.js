/**
 * Cloudinary URL construction.
 *
 * Posts store a `public_id`, never a URL. That is deliberate: a stored URL
 * bakes in the cloud name, the delivery domain, the transformation string and
 * the version, so changing any one of them would break every post at once.
 * Building the URL here means moving accounts or CDNs is an edit to one
 * environment variable.
 */

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/* f_auto and q_auto let Cloudinary pick format and quality per browser, which
   is why the site does not need Next's image optimisation for these. */
export function cloudinaryUrl(publicId, { width, height, crop = "fill" } = {}) {
  if (!publicId || !CLOUD) return null;

  const parts = ["f_auto", "q_auto"];
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (width || height) parts.push(`c_${crop}`);

  return `https://res.cloudinary.com/${CLOUD}/image/upload/${parts.join(",")}/${publicId}`;
}

export function isCloudinaryConfigured() {
  return !!CLOUD;
}

/* ── Responsive delivery ─────────────────────────────────────────────────────
 *
 * Body images keep full URLs in the markdown so the content still renders in
 * GitHub or any other tool. That means the renderer receives a finished URL
 * rather than a public_id, and has to take it apart again to offer the browser
 * anything smaller than the original.
 */

/* Splits a delivery URL into the pieces needed to rebuild it. Returns null for
   anything that is not an image on our own cloud — a URL we do not own must be
   passed through untouched. */
export function parseCloudinaryUrl(url) {
  if (!url || !CLOUD) return null;
  const prefix = `https://res.cloudinary.com/${CLOUD}/image/upload/`;
  if (!url.startsWith(prefix)) return null;

  const segments = url.slice(prefix.length).split("/");
  const transforms = [];
  let i = 0;
  // Leading segments are transformations (f_auto,q_auto) or a version (v123).
  // Everything after them is the public_id, which may itself contain slashes.
  for (; i < segments.length - 1; i++) {
    const s = segments[i];
    if (/^v\d+$/.test(s)) continue;
    if (/^[a-z]{1,3}_[^/]*$/.test(s.split(",")[0])) transforms.push(s);
    else break;
  }
  const publicId = segments.slice(i).join("/");
  if (!publicId) return null;

  return { publicId, transforms: transforms.join(",") };
}

/* The same image at a given width. Any width already in the URL is dropped so
   the requested one wins rather than being appended and ignored. */
export function cloudinaryVariant(url, width) {
  const parsed = parseCloudinaryUrl(url);
  if (!parsed) return null;

  const kept = parsed.transforms
    .split(",")
    .filter((t) => t && !/^[wh]_/.test(t) && !/^c_/.test(t));
  if (!kept.includes("f_auto")) kept.push("f_auto");
  if (!kept.includes("q_auto")) kept.push("q_auto");
  kept.push(`w_${width}`);

  return `https://res.cloudinary.com/${CLOUD}/image/upload/${kept.join(",")}/${parsed.publicId}`;
}

/* Intrinsic dimensions, so width/height can be set on the tag and the browser
 * reserves the right space before the bytes arrive.
 *
 * fl_getinfo is a public delivery URL, not the Admin API, so this needs no
 * credentials. It runs at build and revalidation time, never in a visitor's
 * request, and the result is memoised for the life of the process — a post is
 * rendered far more often than its images change.
 *
 * Failure is not an error: without dimensions the image still renders, it just
 * does not reserve space. Layout shift is worth more than a broken page.
 */
const dimensionCache = new Map();

export async function cloudinaryDimensions(publicId) {
  if (!publicId || !CLOUD) return null;
  if (dimensionCache.has(publicId)) return dimensionCache.get(publicId);

  let result = null;
  try {
    const res = await fetch(
      `https://res.cloudinary.com/${CLOUD}/image/upload/fl_getinfo/${publicId}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const json = await res.json();
      const w = json?.input?.width;
      const h = json?.input?.height;
      if (w && h) result = { width: w, height: h };
    }
  } catch {
    // Offline, slow, or the asset is gone. Fall through to null.
  }

  dimensionCache.set(publicId, result);
  return result;
}
