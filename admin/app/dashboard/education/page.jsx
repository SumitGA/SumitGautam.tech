"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "../../../lib/supabase";
import { useToast } from "../../../components/useToast";

export default function EducationPage() {
  const { show, Toast } = useToast();
  const [degrees, setDegrees] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await getSupabaseBrowser().from("degrees").select("*").order("sort_order");
    setDegrees(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveDegree(degree) {
    const sb = getSupabaseBrowser();
    const { id, ...fields } = degree;
    const { error } = id
      ? await sb.from("degrees").update(fields).eq("id", id)
      : await sb.from("degrees").insert(fields);
    if (error) show(error.message, "error"); else { show("Saved!"); load(); }
  }

  async function deleteDegree(id) {
    if (!confirm("Delete this degree?")) return;
    const { error } = await getSupabaseBrowser().from("degrees").delete().eq("id", id);
    if (error) show(error.message, "error"); else { show("Deleted!"); load(); }
  }

  if (loading) return <div className="spinner" />;

  return (
    <>
      {Toast}
      <div className="page-header">
        <h1>Education</h1>
        <button className="btn-primary"
          onClick={() => saveDegree({ title: "", subtitle: "", logo_path: "", alt_name: "", duration: "", descriptions: [], website_link: "", sort_order: degrees.length })}>
          + Add degree
        </button>
      </div>
      {degrees.map((d) => <DegreeCard key={d.id} degree={d} onSave={saveDegree} onDelete={deleteDegree} />)}
    </>
  );
}

function DegreeCard({ degree, onSave, onDelete }) {
  const [data, setData] = useState({ ...degree, descriptions: degree.descriptions || [] });
  const [open, setOpen] = useState(false);
  const [newDesc, setNewDesc] = useState("");

  const fields = [
    { k: "title", l: "School name" }, { k: "subtitle", l: "Degree / program" },
    { k: "logo_path", l: "Logo filename (in /images/)" }, { k: "alt_name", l: "Alt name" },
    { k: "duration", l: "Duration (e.g. 2020 - 2021)" }, { k: "website_link", l: "School website URL" },
  ];

  function addDesc() {
    if (!newDesc.trim()) return;
    setData((d) => ({ ...d, descriptions: [...d.descriptions, newDesc.trim()] }));
    setNewDesc("");
  }

  function removeDesc(i) {
    setData((d) => ({ ...d, descriptions: d.descriptions.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <span style={{ fontWeight: 500 }}>{data.title || "Untitled"}</span>
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
            <label>Description bullets</label>
            {data.descriptions.map((desc, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                <input value={desc} onChange={(e) => setData((d) => {
                  const arr = [...d.descriptions]; arr[i] = e.target.value; return { ...d, descriptions: arr };
                })} />
                <button className="btn-danger" style={{ padding: "4px 10px", flexShrink: 0 }} onClick={() => removeDesc(i)}>✕</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <input value={newDesc} placeholder="⚡ New bullet…" onChange={(e) => setNewDesc(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDesc())} />
              <button className="btn-secondary" style={{ padding: "4px 12px", flexShrink: 0 }} onClick={addDesc}>Add</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={() => onSave(data)}>Save</button>
            {degree.id && <button className="btn-danger" onClick={() => onDelete(degree.id)}>Delete</button>}
          </div>
        </div>
      )}
    </div>
  );
}
