"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "../../../lib/supabase";
import { useToast } from "../../../components/useToast";

export default function ExperiencePage() {
  const { show, Toast } = useToast();
  const [header, setHeader] = useState({});
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const sb = getSupabaseBrowser();
    const [hRes, secRes, expRes] = await Promise.all([
      sb.from("experience_header").select("*").eq("id", 1).single(),
      sb.from("experience_sections").select("*").order("sort_order"),
      sb.from("experiences").select("*").order("sort_order"),
    ]);
    if (hRes.data) setHeader(hRes.data);
    const secs = (secRes.data || []).map((sec) => ({
      ...sec,
      experiences: (expRes.data || []).filter((e) => e.section_id === sec.id),
    }));
    setSections(secs);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveHeader(e) {
    e.preventDefault();
    const { error } = await getSupabaseBrowser().from("experience_header").upsert({ id: 1, ...header });
    if (error) show(error.message, "error"); else show("Header saved!");
  }

  async function saveExp(exp) {
    const sb = getSupabaseBrowser();
    const { id, ...fields } = exp;
    const { error } = id
      ? await sb.from("experiences").update(fields).eq("id", id)
      : await sb.from("experiences").insert(fields);
    if (error) show(error.message, "error"); else { show("Saved!"); load(); }
  }

  async function deleteExp(id) {
    if (!confirm("Delete this experience entry?")) return;
    const { error } = await getSupabaseBrowser().from("experiences").delete().eq("id", id);
    if (error) show(error.message, "error"); else { show("Deleted!"); load(); }
  }

  if (loading) return <div className="spinner" />;

  return (
    <>
      {Toast}
      <div className="page-header"><h1>Experience</h1></div>

      {/* Page header */}
      <form onSubmit={saveHeader}>
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Page Header</h2>
          {[["title", "Title"], ["subtitle", "Subtitle"], ["description", "Description"]].map(([k, l]) => (
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

      {/* Experience sections */}
      {sections.map((sec) => (
        <div key={sec.id}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "20px 0 12px" }}>{sec.title}</h2>
          {sec.experiences.map((exp) => (
            <ExpCard key={exp.id} exp={exp} onSave={saveExp} onDelete={deleteExp} />
          ))}
          <button className="btn-secondary" style={{ marginBottom: 8 }}
            onClick={() => saveExp({ section_id: sec.id, title: "", company: "", company_url: "", logo_path: "", duration: "", location: "", description: "", color: "#7c4962", sort_order: sec.experiences.length })}>
            + Add entry to {sec.title}
          </button>
        </div>
      ))}
    </>
  );
}

function ExpCard({ exp, onSave, onDelete }) {
  const [data, setData] = useState(exp);
  const [open, setOpen] = useState(false);

  const fields = [
    { k: "title", l: "Job title" }, { k: "company", l: "Company" },
    { k: "company_url", l: "Company URL" }, { k: "logo_path", l: "Logo filename (in /images/)" },
    { k: "duration", l: "Duration" }, { k: "location", l: "Location" },
    { k: "color", l: "Card accent color (hex)" },
  ];

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        onClick={() => setOpen(!open)}>
        <span style={{ fontWeight: 500 }}>{data.title || "Untitled"} — {data.company || "–"}</span>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ marginTop: 16 }}>
          {fields.map(({ k, l }) => (
            <div className="field" key={k}>
              <label>{l}</label>
              <input value={data[k] || ""} onChange={(e) => setData((d) => ({ ...d, [k]: e.target.value }))} />
            </div>
          ))}
          <div className="field">
            <label>Description</label>
            <textarea value={data.description || ""} onChange={(e) => setData((d) => ({ ...d, description: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={() => onSave(data)}>Save</button>
            <button className="btn-danger" onClick={() => onDelete(data.id)}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}
