"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowser } from "../../../lib/supabase";
import { useToast } from "../../../components/useToast";
import { cloudinaryUrl, uploadImage, deleteImages } from "../../../lib/cloudinary";
import ImagePicker from "../../../components/ImagePicker";
import {
  parseFrontmatter,
  fieldsToPost,
  publicIdFromUrl,
  toDevtoFrontmatter,
} from "../../../lib/frontmatter";

const EMPTY = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  status: "draft",
  published_at: null,
  tags: [],
  cover_public_id: null,
  cover_alt: "",
  meta_title: "",
  meta_description: "",
  series: "",
  series_order: null,
  project_slug: "",
};

/* Mirrors the slug rules a reader would expect in a URL. Generated from the
   title only as a starting point — once a post is published the slug is a
   promise, so it is never regenerated behind the author's back. */
function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function readingMinutes(markdown) {
  if (!markdown) return 1;
  const code = (markdown.match(/```[\s\S]*?```/g) || []).join(" ");
  const prose = markdown.replace(/```[\s\S]*?```/g, " ");
  const w = prose.trim().split(/\s+/).filter(Boolean).length;
  const cw = code.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round((w + cw / 3) / 200));
}

export default function BlogAdmin() {
  const { show, Toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await getSupabaseBrowser()
      .from("posts")
      .select("id,slug,title,status,published_at,updated_at,tags")
      .order("updated_at", { ascending: false });
    if (error) show(error.message, "error");
    else setPosts(data || []);
    setLoading(false);
  }, [show]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="spinner" />;

  return (
    <>
      {Toast}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Blog</h1>
        {!editing && (
          <button className="btn-primary" onClick={() => setEditing({ ...EMPTY })}>
            + New post
          </button>
        )}
      </div>

      {editing ? (
        <PostEditor
          post={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
          show={show}
        />
      ) : (
        <PostList posts={posts} onEdit={setEditing} onChanged={load} show={show} />
      )}
    </>
  );
}

/* ── List ─────────────────────────────────────────────────────────────── */

function PostList({ posts, onEdit, onChanged, show }) {
  async function openPost(id) {
    const { data, error } = await getSupabaseBrowser().from("posts").select("*").eq("id", id).single();
    if (error) return show(error.message, "error");
    onEdit(data);
  }

  async function remove(post) {
    if (!confirm(`Delete “${post.title}”? This also removes its images from Cloudinary, and cannot be undone.`)) return;
    const sb = getSupabaseBrowser();

    /* Collect the images before deleting the row — the foreign key cascade
       clears post_images, and once it has there is no record of what this post
       owned in Cloudinary. */
    const [{ data: full }, { data: owned }] = await Promise.all([
      sb.from("posts").select("cover_public_id").eq("id", post.id).maybeSingle(),
      sb.from("post_images").select("public_id").eq("post_id", post.id),
    ]);

    const candidates = [
      ...(owned || []).map((r) => r.public_id),
      full?.cover_public_id,
    ].filter(Boolean);

    /* An image can legitimately belong to more than one post if it was reused.
       Only destroy the ones nothing else references, or deleting one post
       would break the images in another. */
    let toDelete = [];
    if (candidates.length) {
      const [{ data: elsewhere }, { data: covers }] = await Promise.all([
        sb.from("post_images").select("public_id").in("public_id", candidates).neq("post_id", post.id),
        sb.from("posts").select("cover_public_id").in("cover_public_id", candidates).neq("id", post.id),
      ]);
      const stillUsed = new Set([
        ...(elsewhere || []).map((r) => r.public_id),
        ...(covers || []).map((r) => r.cover_public_id),
      ]);
      toDelete = [...new Set(candidates)].filter((id) => !stillUsed.has(id));
    }

    const { error } = await sb.from("posts").delete().eq("id", post.id);
    if (error) return show(error.message, "error");

    /* Report and refresh immediately. The post is gone the moment the row is
       deleted; destroying the images is housekeeping and involves a round trip
       to Cloudinary, so awaiting it just makes the button feel slow for
       something the author is not waiting on. */
    show("Deleted");
    onChanged();

    if (toDelete.length) {
      sb.auth
        .getSession()
        .then(({ data }) => deleteImages(toDelete, data?.session?.access_token))
        .then(({ deleted }) =>
          console.info(`[blog] removed ${deleted?.length || 0} image(s) from Cloudinary`)
        )
        .catch((err) => {
          /* Surfaced rather than swallowed: the post is deleted either way, but
             orphaned images cost storage and stay publicly reachable, so this
             is worth knowing about. */
          console.warn("[blog] image cleanup failed:", err.message);
          show("Post deleted, but its images remain in Cloudinary", "error");
        });
    }
  }

  if (!posts.length) {
    return (
      <div className="card">
        <p style={{ color: "var(--muted)", margin: 0 }}>
          No posts yet. Start one with “New post”.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0 }}>
      {posts.map((p, i) => {
        const scheduled = p.status === "published" && p.published_at && new Date(p.published_at) > new Date();
        return (
          <div
            key={p.id}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "13px 18px",
              borderTop: i ? "1px solid var(--border)" : "none",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500 }}>{p.title || "(untitled)"}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                /{p.slug}
                {p.tags?.length ? ` · ${p.tags.join(", ")}` : ""}
              </div>
            </div>
            <StatusPill status={p.status} scheduled={scheduled} />
            <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => openPost(p.id)}>Edit</button>
            <button className="btn-danger" style={{ fontSize: 13 }} onClick={() => remove(p)}>Delete</button>
          </div>
        );
      })}
    </div>
  );
}

function StatusPill({ status, scheduled }) {
  const label = scheduled ? "scheduled" : status;
  const colour = scheduled ? "#f59e0b" : status === "published" ? "var(--success)" : "var(--muted)";
  return (
    <span style={{
      fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4,
      color: colour, border: `1px solid ${colour}`, borderRadius: 999, padding: "2px 9px",
    }}>
      {label}
    </span>
  );
}

/* ── Editor ───────────────────────────────────────────────────────────── */

function PostEditor({ post, onClose, onSaved, show }) {
  const [data, setData] = useState(post);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [projects, setProjects] = useState([]);
  const [picker, setPicker] = useState(null);      // null | "cover" | "body"
  const [pickerToken, setPickerToken] = useState(null);
  const [pasteText, setPasteText] = useState("");
  const contentRef = useRef(null);
  const isNew = !data.id;

  /* Only projects that actually have a case study page are offered. Linking a
     post to a project with no page would store a slug that renders nothing —
     a silent dead end rather than a visible error. The condition mirrors
     hasCaseStudy() on the site side. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: rows } = await getSupabaseBrowser()
        .from("projects")
        .select("name,slug,problem,approach,outcome")
        .order("name");
      if (cancelled) return;
      setProjects(
        (rows || [])
          .filter((r) => r.slug && (r.problem || r.approach || r.outcome))
          .map((r) => ({ name: r.name, slug: r.slug }))
      );
    })();
    return () => { cancelled = true; };
  }, []);

  const set = (field) => (e) =>
    setData((d) => ({ ...d, [field]: e.target.value }));

  // Only auto-slug while the post has never been saved. After that the slug is
  // a published URL, and renaming it is a deliberate act (the database keeps
  // the old one so links still resolve).
  function onTitleChange(e) {
    const title = e.target.value;
    setData((d) => ({ ...d, title, slug: isNew && !d.slugTouched ? slugify(title) : d.slug }));
  }

  async function accessToken() {
    const { data: s } = await getSupabaseBrowser().auth.getSession();
    return s?.session?.access_token;
  }

  async function handleUpload(file, { asCover }) {
    if (!file) return;
    setUploading(true);
    try {
      const token = await accessToken();
      const { publicId, url } = await uploadImage(file, token);

      if (asCover) {
        setData((d) => ({
          ...d,
          cover_public_id: publicId,
          _newImages: [...(d._newImages || []), publicId],
        }));
      } else {
        /* Body images keep a full URL in the markdown so the content renders
           anywhere. post_images records the public_id separately so the assets
           stay enumerable. */
        const el = contentRef.current;
        const snippet = `\n![](${url})\n`;
        const at = el ? el.selectionStart : (data.content?.length || 0);
        setData((d) => ({
          ...d,
          content: (d.content || "").slice(0, at) + snippet + (d.content || "").slice(at),
          _newImages: [...(d._newImages || []), publicId],
        }));
      }
      show("Image uploaded");
    } catch (err) {
      show(err.message, "error");
    } finally {
      setUploading(false);
    }
  }

  async function openPicker(target) {
    setPickerToken(await accessToken());
    setPicker(target);
  }

  /* Re-using an image, as opposed to uploading one. It still goes into
     _newImages: that list becomes post_images rows, and ownership is what lets
     a delete know an asset is still referenced elsewhere. The upsert is keyed
     on (post_id, public_id), so recording it twice is harmless. */
  function pickImage(img) {
    const publicId = img.publicId;
    if (picker === "cover") {
      setData((d) => ({
        ...d,
        cover_public_id: publicId,
        _newImages: [...(d._newImages || []), publicId],
      }));
    } else {
      const el = contentRef.current;
      /* encodeURI, because a public_id may contain spaces — the account
         already has "My Brand/watermark". Markdown terminates a link target at
         the first space, so an unencoded URL here silently produces a broken
         image. Uploads are unaffected: Cloudinary returns an encoded URL. */
      const snippet = `\n![](${encodeURI(cloudinaryUrl(publicId))})\n`;
      const at = el ? el.selectionStart : (data.content?.length || 0);
      setData((d) => ({
        ...d,
        content: (d.content || "").slice(0, at) + snippet + (d.content || "").slice(at),
        _newImages: [...(d._newImages || []), publicId],
      }));
    }
    show("Image added");
  }

  /* Pasting a post in from somewhere else. The frontmatter maps onto columns;
     anything it cannot map is reported rather than dropped silently, because a
     cover that quietly vanished would be found much later, on the live site. */
  function applyPaste() {
    const { fields, body } = parseFrontmatter(pasteText);
    if (!body.trim()) return show("Nothing to import.", "error");
    if (data.content?.trim() && !confirm("Replace the current content?")) return;

    const mapped = fieldsToPost(fields);
    const { _coverUrl, ...rest } = mapped;
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const coverId = publicIdFromUrl(_coverUrl, cloud);

    setData((d) => ({
      ...d,
      ...rest,
      slug: d.slug || (rest.title ? slugify(rest.title) : d.slug),
      content: body,
      ...(coverId ? { cover_public_id: coverId } : {}),
    }));
    setPasteText("");

    if (_coverUrl && !coverId) {
      show("Imported. The cover is hosted elsewhere — upload it here.", "error");
    } else {
      show("Imported");
    }
  }

  async function copyForDevto() {
    const text = toDevtoFrontmatter(data, {
      siteUrl: process.env.NEXT_PUBLIC_PORTFOLIO_URL || "https://sumitgautam.tech",
      coverUrl: data.cover_public_id ? cloudinaryUrl(data.cover_public_id) : null,
    });
    try {
      await navigator.clipboard.writeText(text);
      show("Copied — published: false, so review it there before going live");
    } catch {
      show("Clipboard blocked by the browser.", "error");
    }
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t || data.tags?.includes(t)) return setTagInput("");
    setData((d) => ({ ...d, tags: [...(d.tags || []), t] }));
    setTagInput("");
  }

  async function save({ publish } = {}) {
    if (!data.title?.trim() || !data.slug?.trim()) {
      return show("Title and slug are required.", "error");
    }
    setSaving(true);

    const status = publish === undefined ? data.status : publish ? "published" : "draft";
    // The database rejects a published post with no date, so supply one on the
    // transition rather than letting the constraint surface as an error.
    const published_at =
      status === "published" ? data.published_at || new Date().toISOString() : data.published_at;

    const row = {
      slug: data.slug.trim(),
      title: data.title.trim(),
      excerpt: data.excerpt?.trim() || null,
      content: data.content || "",
      status,
      published_at,
      tags: data.tags || [],
      cover_public_id: data.cover_public_id || null,
      cover_alt: data.cover_alt?.trim() || null,
      meta_title: data.meta_title?.trim() || null,
      meta_description: data.meta_description?.trim() || null,
      reading_minutes: readingMinutes(data.content),
      // The database requires a position whenever a series is named, so send
      // null for both rather than an empty string that would fail the check.
      series: data.series?.trim() || null,
      series_order: data.series?.trim() ? Number(data.series_order) || 1 : null,
      project_slug: data.project_slug?.trim() || null,
    };

    const sb = getSupabaseBrowser();
    const { data: saved, error } = data.id
      ? await sb.from("posts").update(row).eq("id", data.id).select("id").single()
      : await sb.from("posts").insert(row).select("id").single();

    if (error) {
      setSaving(false);
      return show(error.message, "error");
    }

    if (data._newImages?.length) {
      await sb.from("post_images").upsert(
        data._newImages.map((public_id) => ({ post_id: saved.id, public_id })),
        { onConflict: "post_id,public_id" }
      );
    }

    setSaving(false);
    show(status === "published" ? "Published" : "Saved");
    onSaved();
  }

  return (
    <div className="card">
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button className="btn-secondary" onClick={onClose}>← Back</button>
        <div style={{ flex: 1 }} />
        <button
          className="btn-secondary"
          onClick={copyForDevto}
          disabled={!data.title?.trim() || !data.slug?.trim()}
          title="Frontmatter with canonical_url pointing here, plus the body"
        >
          Copy for dev.to
        </button>
        <button className="btn-secondary" disabled={saving} onClick={() => save({ publish: false })}>
          Save draft
        </button>
        <button className="btn-primary" disabled={saving} onClick={() => save({ publish: true })}>
          {data.status === "published" ? "Save & keep published" : "Publish"}
        </button>
      </div>

      <div className="field">
        <label>Title</label>
        <input value={data.title || ""} onChange={onTitleChange} placeholder="What broke, and what fixed it" />
      </div>

      <div className="field">
        <label>Slug — the public URL. Changing it after publishing keeps the old one working.</label>
        <input
          value={data.slug || ""}
          onChange={(e) => setData((d) => ({ ...d, slug: slugify(e.target.value), slugTouched: true }))}
          placeholder="gemini-flash-lite-streaming"
        />
      </div>

      <div className="field">
        <label>Excerpt — shown in the list, RSS and search results</label>
        <textarea rows={2} value={data.excerpt || ""} onChange={set("excerpt")} />
      </div>

      <div className="field">
        <label>Tags</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {(data.tags || []).map((t) => (
            <span key={t} style={{
              fontSize: 12, padding: "3px 9px", borderRadius: 999,
              border: "1px solid var(--border)", display: "inline-flex", gap: 6,
            }}>
              {t}
              <button
                onClick={() => setData((d) => ({ ...d, tags: d.tags.filter((x) => x !== t) }))}
                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0 }}
                aria-label={`Remove ${t}`}
              >×</button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            placeholder="rust, then Enter"
          />
          <button className="btn-secondary" onClick={addTag}>Add</button>
        </div>
      </div>

      <div className="field">
        <label>Cover image</label>
        {data.cover_public_id && (
          <img
            src={cloudinaryUrl(data.cover_public_id, { width: 320, height: 180 })}
            alt=""
            style={{ display: "block", borderRadius: 6, marginBottom: 8, maxWidth: 320 }}
          />
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="file" accept="image/*" disabled={uploading}
            onChange={(e) => handleUpload(e.target.files?.[0], { asCover: true })} />
          <button className="btn-secondary" style={{ fontSize: 13 }}
            onClick={() => openPicker("cover")}>Choose existing</button>
          {data.cover_public_id && (
            <button className="btn-secondary" style={{ fontSize: 13 }}
              onClick={() => setData((d) => ({ ...d, cover_public_id: null }))}>Remove</button>
          )}
        </div>
        {data.cover_public_id && (
          <input style={{ marginTop: 8 }} value={data.cover_alt || ""} onChange={set("cover_alt")}
            placeholder="Alt text — describe the image for screen readers" />
        )}
      </div>

      <div className="field">
        <label>
          Content — markdown. Fenced code blocks get syntax highlighting.
        </label>
        <textarea
          ref={contentRef}
          rows={22}
          value={data.content || ""}
          onChange={set("content")}
          style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, lineHeight: 1.6 }}
          placeholder={"## The problem\n\nSome prose.\n\n```rust\nfn main() {}\n```"}
        />
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
          <label className="btn-secondary" style={{ fontSize: 13, cursor: "pointer", display: "inline-block" }}>
            {uploading ? "Uploading…" : "Insert image"}
            <input type="file" accept="image/*" hidden disabled={uploading}
              onChange={(e) => handleUpload(e.target.files?.[0], { asCover: false })} />
          </label>
          <button className="btn-secondary" style={{ fontSize: 13 }}
            onClick={() => openPicker("body")}>Choose existing</button>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {readingMinutes(data.content)} min read
          </span>
        </div>
      </div>

      <details style={{ marginTop: 6, marginBottom: 14 }}>
        <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--muted)" }}>
          Paste markdown with frontmatter
        </summary>
        <div style={{ marginTop: 10 }}>
          <textarea
            rows={6}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"---\ntitle: …\ndescription: …\ntags: rust, postgres\n---\n\nThe post body."}
            style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.5 }}
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
            <button className="btn-secondary" onClick={applyPaste} disabled={!pasteText.trim()}>
              Import
            </button>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              Fills title, excerpt, tags, series and cover from the header. A cover
              hosted outside this Cloudinary account has to be uploaded here.
            </span>
          </div>
        </div>
      </details>

      <div className="field">
        <label>Series — leave blank for a standalone post</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ flex: 1 }}
            value={data.series || ""}
            onChange={set("series")}
            placeholder="HazShield AI"
          />
          <input
            type="number"
            min="1"
            style={{ width: 110 }}
            value={data.series_order ?? ""}
            onChange={(e) =>
              setData((d) => ({ ...d, series_order: e.target.value === "" ? null : Number(e.target.value) }))
            }
            placeholder="Part #"
            disabled={!data.series?.trim()}
          />
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "6px 0 0" }}>
          Parts are listed in this order, not by date — so publishing something
          else in between does not break the series.
        </p>
      </div>

      <div className="field">
        <label>Project — links this post to a case study, in both directions</label>
        <select value={data.project_slug || ""} onChange={set("project_slug")}>
          <option value="">None</option>
          {projects.map((p) => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>
      </div>

      <details style={{ marginTop: 6 }}>
        <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--muted)" }}>
          SEO and scheduling
        </summary>
        <div style={{ marginTop: 12 }}>
          <div className="field">
            <label>Meta title — defaults to the post title</label>
            <input value={data.meta_title || ""} onChange={set("meta_title")} />
          </div>
          <div className="field">
            <label>Meta description — defaults to the excerpt</label>
            <textarea rows={2} value={data.meta_description || ""} onChange={set("meta_description")} />
          </div>
          <div className="field">
            <label>Publish date — a future date schedules the post; it appears on its own</label>
            <input
              type="datetime-local"
              value={data.published_at ? new Date(data.published_at).toISOString().slice(0, 16) : ""}
              onChange={(e) =>
                setData((d) => ({ ...d, published_at: e.target.value ? new Date(e.target.value).toISOString() : null }))
              }
            />
          </div>
        </div>
      </details>

      {picker && (
        <ImagePicker
          token={pickerToken}
          onPick={pickImage}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
