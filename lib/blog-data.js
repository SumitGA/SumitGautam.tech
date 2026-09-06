/**
 * Blog data access. Server-side only.
 *
 * Reads go through the anon client on purpose: row level security already
 * restricts SELECT to posts that are published and whose date has arrived, so
 * drafts and scheduled posts are invisible without any filtering here. The
 * rule lives in the database rather than in a WHERE clause someone can forget.
 */
import { getSupabaseServer } from "./supabase";

const configured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function db() {
  return configured ? getSupabaseServer() : null;
}

// Everything except `content`, for list views — a post body can be large and
// an index page never renders it.
const LIST_FIELDS =
  "id,slug,title,excerpt,published_at,updated_at,tags,cover_public_id,cover_alt,reading_minutes,series,series_order,project_slug";

export async function getPosts({ tag = null, limit = null } = {}) {
  const supabase = db();
  if (!supabase) return [];

  let query = supabase
    .from("posts")
    .select(LIST_FIELDS)
    .order("published_at", { ascending: false });

  if (tag) query = query.contains("tags", [tag]);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error("[blog] getPosts:", error.message);
    return [];
  }
  return data || [];
}

export async function getPostBySlug(slug) {
  const supabase = db();
  if (!supabase || !slug) return null;

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[blog] getPostBySlug:", error.message);
    return null;
  }
  return data || null;
}

/* Given a slug that did not resolve, find the post that used to own it and
   return its current slug — so a renamed post redirects rather than 404s.
   Returns null when the slug was never used, which is a genuine 404. */
export async function resolveOldSlug(slug) {
  const supabase = db();
  if (!supabase || !slug) return null;

  const { data, error } = await supabase
    .from("post_slugs")
    .select("post_id")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;

  const { data: post } = await supabase
    .from("posts")
    .select("slug")
    .eq("id", data.post_id)
    .maybeSingle();

  // Null when the post is now a draft or deleted: RLS hides it, and a
  // redirect to something the visitor cannot see would be worse than a 404.
  return post?.slug && post.slug !== slug ? post.slug : null;
}

export async function getPostSlugs() {
  const supabase = db();
  if (!supabase) return [];
  const { data, error } = await supabase.from("posts").select("slug");
  if (error) return [];
  return (data || []).map((r) => r.slug);
}

export async function getAllTags() {
  const supabase = db();
  if (!supabase) return [];
  const { data, error } = await supabase.from("posts").select("tags");
  if (error) return [];
  const counts = new Map();
  for (const row of data || []) {
    for (const t of row.tags || []) counts.set(t, (counts.get(t) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/* The posts either side of this one, by publication date.
 *
 * Two small queries rather than loading the list and finding the index: at a
 * thousand posts the list approach would fetch a thousand rows to use two, and
 * this stays constant-time as the blog grows.
 *
 * "next" is the newer post and "prev" the older, matching how a reader moves
 * through an archive rather than how an array is ordered.
 */
export async function getAdjacentPosts(publishedAt) {
  const supabase = db();
  if (!supabase || !publishedAt) return { prev: null, next: null };

  const [older, newer] = await Promise.all([
    supabase
      .from("posts")
      .select("slug,title")
      .lt("published_at", publishedAt)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("posts")
      .select("slug,title")
      .gt("published_at", publishedAt)
      .order("published_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  return { prev: older.data || null, next: newer.data || null };
}

/* Every published part of a series, in reading order.
 *
 * Ordered by series_order rather than date on purpose: that is the whole
 * point of the column. Previous/next stays chronological — it means "more
 * posts", which is a different question from "where am I in this series" —
 * so publishing something unrelated between two parts no longer breaks the
 * reading path.
 *
 * RLS still applies, so a part that is drafted or scheduled is simply absent.
 * That is the desired behaviour: a series shows the parts a reader can
 * actually open, and Part 3 appears the moment it goes live.
 */
export async function getSeriesPosts(series) {
  const supabase = db();
  if (!supabase || !series) return [];

  const { data, error } = await supabase
    .from("posts")
    .select("slug,title,series,series_order")
    .eq("series", series)
    .order("series_order", { ascending: true });

  if (error) {
    console.error("[blog] getSeriesPosts:", error.message);
    return [];
  }
  return data || [];
}

/* Posts written about a given project, newest first — the reverse of the link
 * on the post itself, so a case study can point at the deep dives.
 *
 * The slug is matched rather than joined: projects.slug is unique only
 * through a partial index, which Postgres cannot use to back a foreign key.
 * A slug that matches no project simply returns nothing.
 */
export async function getPostsForProject(projectSlug) {
  const supabase = db();
  if (!supabase || !projectSlug) return [];

  const { data, error } = await supabase
    .from("posts")
    .select("slug,title,excerpt,published_at,reading_minutes,series,series_order")
    .eq("project_slug", projectSlug)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("[blog] getPostsForProject:", error.message);
    return [];
  }
  return data || [];
}
