import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import {
  parseCloudinaryUrl,
  cloudinaryVariant,
  cloudinaryDimensions,
} from "./cloudinary";

/* Markdown → HTML, rendered on the server.
 *
 * Everything here runs at build or revalidate time, so none of it reaches the
 * browser. A post arrives as static HTML with the syntax highlighting already
 * baked in — no client-side highlighter, no flash of unstyled code.
 *
 * The pipeline is the reason the schema stores markdown rather than HTML:
 * adding callouts, footnotes or diagrams later is a plugin added here, with no
 * migration of existing posts.
 */

const THEMES = { light: "github-light", dark: "github-dark" };

/* The prose column is 720px, so 1440 covers a 2x display and the smaller steps
   cover phones. Nothing wider is worth sending: the browser would only scale
   it back down. */
const IMG_WIDTHS = [480, 720, 1080, 1440];
const IMG_SIZES = "(max-width: 760px) 100vw, 720px";

/* Body images arrive as bare <img src> from the markdown, which is the worst
 * shape for Core Web Vitals: no dimensions, so every figure shoves the text
 * down as it loads, and no loading hint, so images far below the fold compete
 * with the ones the reader can actually see.
 *
 * This is a plugin rather than a change to how images are authored, because
 * the markdown has to stay portable — a full URL that renders in GitHub was a
 * deliberate choice, and rewriting it in the source to carry dimensions would
 * undo that.
 *
 * Only images on our own Cloudinary get a srcset; anything else is left alone
 * beyond the loading hints, since we cannot resize what we do not serve.
 */
function rehypeResponsiveImages() {
  return async (tree) => {
    const images = [];
    (function walk(node) {
      if (node?.type === "element" && node.tagName === "img") images.push(node);
      for (const child of node?.children || []) walk(child);
    })(tree);

    await Promise.all(
      images.map(async (node) => {
        const props = (node.properties ||= {});
        props.loading = "lazy";
        props.decoding = "async";

        const src = String(props.src || "");
        const parsed = parseCloudinaryUrl(src);
        if (!parsed) return;

        props.srcSet = IMG_WIDTHS.map((w) => `${cloudinaryVariant(src, w)} ${w}w`).join(", ");
        props.sizes = IMG_SIZES;
        // The plain src is what a browser without srcset support falls back to,
        // and what most crawlers read. Full size is wasteful for a 720px column.
        props.src = cloudinaryVariant(src, 1080);

        const dims = await cloudinaryDimensions(parsed.publicId);
        if (dims) {
          props.width = dims.width;
          props.height = dims.height;
        }
      })
    );
  };
}

let processor;
function getProcessor() {
  // Shiki loads its grammars once and is expensive to construct, so the
  // processor is built lazily and reused across renders.
  processor ||= unified()
    .use(remarkParse)
    .use(remarkGfm)
    // Markdown does not carry raw HTML through by default and we keep it that
    // way: content is author-controlled, but allowing arbitrary HTML makes the
    // pipeline an injection surface for no benefit that markdown lacks.
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeShiki, {
      themes: THEMES,
      // Emits CSS variables for both themes so code blocks follow the site's
      // light/dark toggle without re-highlighting.
      defaultColor: false,
    })
    // After Shiki so it only ever walks the finished tree.
    .use(rehypeResponsiveImages)
    .use(rehypeStringify);
  return processor;
}

export async function renderMarkdown(markdown) {
  if (!markdown?.trim()) return "";
  const file = await getProcessor().process(markdown);
  return String(file);
}

/* Headings, for a table of contents. Derived rather than stored so it can
   never drift from the content. */
export function extractHeadings(markdown) {
  if (!markdown) return [];
  const out = [];
  // Skip fenced code blocks, where a leading # is a comment, not a heading.
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    const text = m[2].replace(/[*_`]/g, "").trim();
    out.push({
      depth: m[1].length,
      text,
      // Must match rehype-slug's output (github-slugger).
      id: text.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-"),
    });
  }
  return out;
}

/* 200 wpm is the usual reading-speed assumption. Code is skimmed rather than
   read, so it is counted at a third weight instead of word-for-word. */
export function readingMinutes(markdown) {
  if (!markdown) return 1;
  const code = (markdown.match(/```[\s\S]*?```/g) || []).join(" ");
  const prose = markdown.replace(/```[\s\S]*?```/g, " ");
  const words = prose.trim().split(/\s+/).filter(Boolean).length;
  const codeWords = code.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round((words + codeWords / 3) / 200));
}
