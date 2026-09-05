/* Shared by the AppIcon component and scripts/check-icons.mjs.
   Kept free of React and CSS imports so plain Node can load it.
   .mjs so Node treats it as ESM — this package has no "type": "module". */

/* Iconify 1.x — the CDN script AppIcon replaced — accepted dash notation for
   icon names ("logos-react", "fa-css3"). Iconify 3+ requires a colon between
   the collection and the icon ("logos:react"), so every v1-era name silently
   resolves to nothing.

   Icon names are CMS-editable, so old-style names can arrive from Supabase at
   any time, and anyone copying from a v1-era snippet will still type them.
   Converting here keeps both notations working. Splitting on the first dash is
   not safe — the "vscode-icons" collection contains one — hence the list. */
export const KNOWN_PREFIXES = [
  "simple-icons",
  "vscode-icons",
  "logos",
  "devicon",
  "cib",
  "mdi",
  "fa",
];

export function normalizeIconName(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return null;
  if (trimmed.includes(":")) return trimmed;
  const prefix = KNOWN_PREFIXES.find((p) => trimmed.startsWith(`${p}-`));
  return prefix ? `${prefix}:${trimmed.slice(prefix.length + 1)}` : trimmed;
}
