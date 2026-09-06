import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";

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
