#!/usr/bin/env node
/*
 * Validates every icon name the site renders against the Iconify API.
 *
 * Icon names live in Supabase (CMS-editable) and in the static fallback, and a
 * name that does not resolve renders as nothing at all — no error, no warning,
 * just a gap. That is how `simple-icons:java` and `simple-icons:node-dot-js`
 * sat broken on the live site unnoticed. This makes that failure loud.
 *
 *   npm run check:icons
 *
 * Exits non-zero if any name fails to resolve.
 */
import { readFileSync } from "node:fs";
import { normalizeIconName } from "../src/components/icon/icon-name.mjs";

const API = "https://api.iconify.design";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      for (const line of readFileSync(file, "utf8").split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
        if (m && !process.env[m[1]]) {
          process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
        }
      }
    } catch {
      /* file is optional */
    }
  }
}

async function fromSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("! Supabase env vars not set — checking static fallback only.\n");
    return [];
  }
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const get = async (path) => {
    const res = await fetch(`${url}/rest/v1/${path}`, { headers });
    if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
    return res.json();
  };

  const found = [];
  try {
    for (const row of await get("skill_sections?select=title,software_skills")) {
      for (const s of row.software_skills || []) {
        if (s.fontAwesomeClassname) {
          found.push({ name: s.fontAwesomeClassname, where: `skills / ${row.title} / ${s.skillName}` });
        }
      }
    }
    for (const row of await get("projects?select=name,languages")) {
      for (const l of row.languages || []) {
        if (l.iconifyClass) {
          found.push({ name: l.iconifyClass, where: `project / ${row.name} / ${l.name}` });
        }
      }
    }
  } catch (err) {
    console.warn(`! Could not read Supabase (${err.message}) — checking static fallback only.\n`);
  }
  return found;
}

function fromFallback() {
  const src = readFileSync("src/portfolio.js", "utf8");
  const re = /(?:fontAwesomeClassname|iconifyClass):\s*"([^"]+)"/g;
  const found = [];
  for (const m of src.matchAll(re)) {
    found.push({ name: m[1], where: "src/portfolio.js" });
  }
  return found;
}

async function resolvable(names) {
  const byPrefix = new Map();
  for (const n of names) {
    const [prefix, icon] = [n.slice(0, n.indexOf(":")), n.slice(n.indexOf(":") + 1)];
    if (!byPrefix.has(prefix)) byPrefix.set(prefix, new Set());
    byPrefix.get(prefix).add(icon);
  }

  const ok = new Set();
  for (const [prefix, icons] of byPrefix) {
    const res = await fetch(`${API}/${prefix}.json?icons=${[...icons].join(",")}`);
    if (!res.ok) {
      console.warn(`! Iconify API returned HTTP ${res.status} for "${prefix}" — skipping that collection.`);
      for (const i of icons) ok.add(`${prefix}:${i}`);
      continue;
    }
    const data = await res.json();
    // The API echoes unknown names back in `not_found`, so presence in the
    // response body is NOT proof the icon exists — only these two maps are.
    const known = new Set([...Object.keys(data.icons || {}), ...Object.keys(data.aliases || {})]);
    for (const i of icons) if (known.has(i)) ok.add(`${prefix}:${i}`);
  }
  return ok;
}

loadEnv();

const entries = [...(await fromSupabase()), ...fromFallback()];
const usages = new Map();
for (const e of entries) {
  const norm = normalizeIconName(e.name);
  if (!norm) continue;
  if (!usages.has(norm)) usages.set(norm, { raw: new Set(), where: [] });
  usages.get(norm).raw.add(e.name);
  usages.get(norm).where.push(e.where);
}

const unprefixed = [...usages.keys()].filter((n) => !n.includes(":"));
const checkable = [...usages.keys()].filter((n) => n.includes(":"));
const ok = await resolvable(checkable);
const broken = checkable.filter((n) => !ok.has(n)).concat(unprefixed);

console.log(`Checked ${usages.size} unique icon names across ${entries.length} usages.`);

if (!broken.length) {
  console.log("All icon names resolve.");
  process.exit(0);
}

console.error(`\n${broken.length} icon name(s) do not resolve:\n`);
for (const n of broken.sort()) {
  const u = usages.get(n);
  const raw = [...u.raw].filter((r) => r !== n);
  console.error(`  ${n}${raw.length ? `  (stored as ${raw.join(", ")})` : ""}`);
  for (const w of [...new Set(u.where)]) console.error(`      used by: ${w}`);
}
console.error("\nSearch for a replacement at https://icon-sets.iconify.design/");
process.exit(1);
