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

function ProjectCard({ project, onSave, onDelete }) {
  const [data, setData] = useState({ ...project, languages: project.languages || [] });
  const [open, setOpen] = useState(false);
  const [newLang, setNewLang] = useState({ name: "", iconifyClass: "" });

  function addLang() {
    if (!newLang.name.trim()) return;
    setData((d) => ({ ...d, languages: [...d.languages, { ...newLang }] }));
    setNewLang({ name: "", iconifyClass: "" });
  }

  function removeLang(i) {
    setData((d) => ({ ...d, languages: d.languages.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <span style={{ fontWeight: 500 }}>{data.name || "Untitled project"}</span>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ marginTop: 16 }}>
          {[["name", "Project name"], ["url", "GitHub / Live URL"]].map(([k, l]) => (
            <div className="field" key={k}>
              <label>{l}</label>
              <input value={data[k] || ""} onChange={(e) => setData((d) => ({ ...d, [k]: e.target.value }))} />
            </div>
          ))}
          <div className="field">
            <label>Description</label>
            <textarea value={data.description || ""} onChange={(e) => setData((d) => ({ ...d, description: e.target.value }))} />
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
