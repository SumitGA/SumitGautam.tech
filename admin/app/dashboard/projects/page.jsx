"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "../../../lib/supabase";
import { useToast } from "../../../components/useToast";

export default function ProjectsPage() {
  const { show, Toast } = useToast();
  const [header, setHeader] = useState({});
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const sb = getSupabaseBrowser();
    const [hRes, pRes] = await Promise.all([
      sb.from("projects_header").select("*").eq("id", 1).single(),
      sb.from("projects").select("*").order("sort_order"),
    ]);
    if (hRes.data) setHeader(hRes.data);
    setProjects(pRes.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveHeader(e) {
    e.preventDefault();
    const { error } = await getSupabaseBrowser().from("projects_header").upsert({ id: 1, ...header });
    if (error) show(error.message, "error"); else show("Header saved!");
  }

  async function saveProject(proj) {
    const sb = getSupabaseBrowser();
    const { id, ...fields } = proj;
    const { error } = id
      ? await sb.from("projects").update(fields).eq("id", id)
      : await sb.from("projects").insert(fields);
    if (error) show(error.message, "error"); else { show("Saved!"); load(); }
  }

  async function deleteProject(id) {
    if (!confirm("Delete project?")) return;
    const { error } = await getSupabaseBrowser().from("projects").delete().eq("id", id);
    if (error) show(error.message, "error"); else { show("Deleted!"); load(); }
  }

  if (loading) return <div className="spinner" />;

  return (
    <>
      {Toast}
      <div className="page-header"><h1>Projects</h1></div>

      <form onSubmit={saveHeader}>
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Page Header</h2>
          {[["title", "Title"], ["description", "Description"]].map(([k, l]) => (
            <div className="field" key={k}>
              <label>{l}</label>
              {k === "description" ? (
                <textarea value={header[k] || ""} onChange={(e) => setHeader((h) => ({ ...h, [k]: e.target.value }))} />
              ) : (
                <input value={header[k] || ""} onChange={(e) => setHeader((h) => ({ ...h, [k]: e.target.value }))} />
              )}
            </div>
          ))}
        </div>
        <button type="submit" className="btn-primary" style={{ marginBottom: 24 }}>Save header</button>
      </form>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Projects</h2>
        <button className="btn-primary"
          onClick={() => saveProject({ name: "", url: "", description: "", languages: [], sort_order: projects.length })}>
          + Add project
        </button>
      </div>
      {projects.map((p) => <ProjectCard key={p.id} project={p} onSave={saveProject} onDelete={deleteProject} />)}
    </>
  );
}

function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ProjectCard({ project, onSave, onDelete }) {
  const [data, setData] = useState({
    ...project,
    languages: project.languages || [],
    highlights: project.highlights || [],
  });
  const [open, setOpen] = useState(false);
  const [newLang, setNewLang] = useState({ name: "", iconifyClass: "" });
  const [newHighlight, setNewHighlight] = useState("");

  const set = (k) => (e) => setData((d) => ({ ...d, [k]: e.target.value }));

  // Mirrors hasCaseStudy() in lib/portfolio-data.js
  const liveCaseStudy = !!(data.slug && (data.problem || data.approach || data.outcome));

  function addLang() {
    if (!newLang.name.trim()) return;
    setData((d) => ({ ...d, languages: [...d.languages, { ...newLang }] }));
    setNewLang({ name: "", iconifyClass: "" });
  }

  function removeLang(i) {
    setData((d) => ({ ...d, languages: d.languages.filter((_, idx) => idx !== i) }));
  }

  function addHighlight() {
    if (!newHighlight.trim()) return;
    setData((d) => ({ ...d, highlights: [...d.highlights, newHighlight.trim()] }));
    setNewHighlight("");
  }

  function removeHighlight(i) {
    setData((d) => ({ ...d, highlights: d.highlights.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <span style={{ fontWeight: 500 }}>
          {data.name || "Untitled project"}
          {liveCaseStudy && (
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: "#fff", background: "#E3405F", padding: "2px 7px", borderRadius: 9 }}>
              CASE STUDY
            </span>
          )}
        </span>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ marginTop: 16 }}>
          {[["name", "Project name"], ["url", "GitHub / Live URL"]].map(([k, l]) => (
            <div className="field" key={k}>
              <label>{l}</label>
              <input value={data[k] || ""} onChange={set(k)} />
            </div>
          ))}
          <div className="field">
            <label>Description</label>
            <textarea value={data.description || ""} onChange={set("description")} />
          </div>

          {/* ── Case study ───────────────────────────────────────────── */}
          <div style={{ borderTop: "1px solid var(--border, #333)", margin: "20px 0 16px", paddingTop: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Case study</h3>
            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
              Needs a <strong>slug</strong> plus at least one of Problem / What I built / Outcome.
              Once filled, the card links to <code>/projects/{data.slug || "your-slug"}</code> instead
              of the external URL, and the site chatbot can answer questions about it.
            </p>

            <div className="field">
              <label>Slug (URL)</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input style={{ flex: 1 }} value={data.slug || ""} placeholder="my-project"
                  onChange={(e) => setData((d) => ({ ...d, slug: slugify(e.target.value) }))} />
                <button type="button" className="btn-secondary" style={{ padding: "4px 10px", flexShrink: 0 }}
                  onClick={() => setData((d) => ({ ...d, slug: slugify(d.name || "") }))}>
                  From name
                </button>
              </div>
            </div>

            {[
              ["tagline", "Tagline (one line, shown on the card)"],
              ["role", "Your role (e.g. Solo build, Lead engineer)"],
              ["timeframe", "Timeframe (e.g. 2024 · 3 months)"],
              ["stack_line", "Stack line (e.g. React · FastAPI · Postgres)"],
              ["live_url", "Live URL (optional)"],
              ["repo_url", "Repo URL (optional — falls back to the URL above)"],
            ].map(([k, l]) => (
              <div className="field" key={k}>
                <label>{l}</label>
                <input value={data[k] || ""} onChange={set(k)} />
              </div>
            ))}

            {[
              ["problem", "The problem", "What needed solving, and why it mattered."],
              ["approach", "What I built", "The approach, architecture and key decisions."],
              ["outcome", "Outcome", "Results, metrics, what you learned."],
            ].map(([k, l, ph]) => (
              <div className="field" key={k}>
                <label>{l}</label>
                <textarea rows={4} placeholder={ph} value={data[k] || ""} onChange={set(k)} />
              </div>
            ))}

            <div className="field">
              <label>Highlights (short metric callouts)</label>
              {data.highlights.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <input style={{ flex: 1 }} value={h}
                    onChange={(e) => {
                      const arr = [...data.highlights]; arr[i] = e.target.value;
                      setData((d) => ({ ...d, highlights: arr }));
                    }} />
                  <button type="button" className="btn-danger" style={{ padding: "4px 8px", flexShrink: 0 }}
                    onClick={() => removeHighlight(i)}>✕</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <input style={{ flex: 1 }} value={newHighlight} placeholder="e.g. 60% faster ingest"
                  onChange={(e) => setNewHighlight(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHighlight(); } }} />
                <button type="button" className="btn-secondary" style={{ padding: "4px 10px", flexShrink: 0 }}
                  onClick={addHighlight}>Add</button>
              </div>
            </div>
          </div>

          <div className="field">
            <label>Languages / tech stack</label>
            {data.languages.map((lang, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <input style={{ flex: 1 }} value={lang.name} placeholder="Name"
                  onChange={(e) => {
                    const arr = [...data.languages]; arr[i] = { ...arr[i], name: e.target.value };
                    setData((d) => ({ ...d, languages: arr }));
                  }} />
                <input style={{ flex: 2 }} value={lang.iconifyClass} placeholder="Iconify class (e.g. logos-react)"
                  onChange={(e) => {
                    const arr = [...data.languages]; arr[i] = { ...arr[i], iconifyClass: e.target.value };
                    setData((d) => ({ ...d, languages: arr }));
                  }} />
                <button className="btn-danger" style={{ padding: "4px 8px", flexShrink: 0 }} onClick={() => removeLang(i)}>✕</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <input style={{ flex: 1 }} value={newLang.name} placeholder="Name"
                onChange={(e) => setNewLang((l) => ({ ...l, name: e.target.value }))} />
              <input style={{ flex: 2 }} value={newLang.iconifyClass} placeholder="Iconify class"
                onChange={(e) => setNewLang((l) => ({ ...l, iconifyClass: e.target.value }))} />
              <button className="btn-secondary" style={{ padding: "4px 10px", flexShrink: 0 }} onClick={addLang}>Add</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={() => onSave(data)}>Save</button>
            {project.id && <button className="btn-danger" onClick={() => onDelete(project.id)}>Delete</button>}
          </div>
        </div>
      )}
    </div>
  );
}
