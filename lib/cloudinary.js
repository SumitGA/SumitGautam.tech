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
