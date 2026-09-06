/* Frontmatter in and out.
 *
 * Cross-posting is the actual publishing workflow, and both directions were
 * manual: strip a dev.to header by hand on the way in, retype one on the way
 * out. Retyping is where canonical_url gets forgotten, and a cross-post
 * without it hands the ranking to the other site.
 *
 * Deliberately not a YAML library. The frontmatter this has to read is a flat
 * list of scalars and one comma list; a parser for the whole of YAML would be
 * a dependency and a much larger surface for the sake of nothing extra.
 */

/* dev.to comments out optional keys with "#". Those are instructions to the
   author, not values, so they are dropped rather than read as a key. */
function isComment(line) {
  return /^\s*#/.test(line);
}

function stripQuotes(value) {
  const v = value.trim();
  if (v.length > 1 && ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'")))) {
    return v.slice(1, -1);
  }
  return v;
}

/**
 * Splits "---\nkey: value\n---\nbody" into fields and body.
 * Text with no frontmatter is all body, which is the right answer for someone
 * pasting a plain markdown file.
 */
export function parseFrontmatter(text) {
  const src = String(text || "").replace(/^﻿/, "");
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (!match) return { fields: {}, body: src.trim() };

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || isComment(line)) continue;
    const at = line.indexOf(":");
    if (at === -1) continue;
    const key = line.slice(0, at).trim().toLowerCase();
    const value = stripQuotes(line.slice(at + 1));
    if (key) fields[key] = value;
  }

  return { fields, body: src.slice(match[0].length).trim() };
}

/** Frontmatter fields mapped onto the columns this CMS actually stores. */
export function fieldsToPost(fields) {
  const out = {};
  if (fields.title) out.title = fields.title;
  // dev.to calls it description; here the same text is the excerpt, which
  // feeds the index, RSS and the meta description.
  if (fields.description) out.excerpt = fields.description;
  if (fields.tags) {
    out.tags = fields.tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }
  if (fields.series) out.series = fields.series;
  /* cover_image is a full URL; this schema stores a public_id, because a
     stored URL bakes in the cloud name. Only our own URLs can be converted,
     so a cover hosted elsewhere is reported rather than silently dropped. */
  if (fields.cover_image) out._coverUrl = fields.cover_image;
  return out;
}

/** The public_id inside one of our own delivery URLs, or null. */
export function publicIdFromUrl(url, cloudName) {
  if (!url || !cloudName) return null;
  const prefix = `https://res.cloudinary.com/${cloudName}/image/upload/`;
  if (!String(url).startsWith(prefix)) return null;

  const segments = String(url).slice(prefix.length).split("/");
  let i = 0;
  for (; i < segments.length - 1; i++) {
    const s = segments[i];
    if (/^v\d+$/.test(s)) continue;
    if (/^[a-z]{1,3}_[^/]*$/.test(s.split(",")[0])) continue;
    break;
  }
  return segments.slice(i).join("/") || null;
}

/**
 * The block to paste into dev.to. canonical_url is always present and always
 * points here — that is the entire reason this exists, since it is the field
 * that decides which copy of the writing search engines credit.
 */
export function toDevtoFrontmatter(post, { siteUrl, coverUrl } = {}) {
  const lines = ["---"];
  lines.push(`title: ${post.title || ""}`);
  lines.push("published: false");
  lines.push(`description: ${(post.excerpt || "").replace(/\s+/g, " ").trim()}`);
  // dev.to allows four tags and rejects anything but letters and digits.
  const tags = (post.tags || [])
    .map((t) => t.replace(/[^a-z0-9]/gi, "").toLowerCase())
    .filter(Boolean)
    .slice(0, 4);
  lines.push(`tags: ${tags.join(", ")}`);
  if (post.series) lines.push(`series: ${post.series}`);
  if (siteUrl && post.slug) lines.push(`canonical_url: ${siteUrl}/blog/${post.slug}`);
  if (coverUrl) lines.push(`cover_image: ${coverUrl}`);
  lines.push("---");
  return `${lines.join("\n")}\n\n${post.content || ""}`;
}
