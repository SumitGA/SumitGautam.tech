"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "../../../lib/supabase";
import { useToast } from "../../../components/useToast";

const fields = [
  { k: "title", l: "Title" }, { k: "subtitle", l: "Subtitle" },
  { k: "logo_path", l: "Logo URL or filename" }, { k: "certificate_link", l: "Certificate link" },
  { k: "alt_name", l: "Alt name" }, { k: "color_code", l: "Color code (hex)" },
];

export default function CertificationsPage() {
  const { show, Toast } = useToast();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await getSupabaseBrowser().from("certifications").select("*").order("sort_order");
    setCerts(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveCert(cert) {
    const sb = getSupabaseBrowser();
    const { id, ...f } = cert;
    const { error } = id ? await sb.from("certifications").update(f).eq("id", id)
      : await sb.from("certifications").insert(f);
    if (error) show(error.message, "error"); else { show("Saved!"); load(); }
  }

  async function deleteCert(id) {
    if (!confirm("Delete?")) return;
    const { error } = await getSupabaseBrowser().from("certifications").delete().eq("id", id);
    if (error) show(error.message, "error"); else { show("Deleted!"); load(); }
  }

  if (loading) return <div className="spinner" />;

  return (
    <>
      {Toast}
      <div className="page-header">
        <h1>Certifications</h1>
        <button className="btn-primary"
          onClick={() => saveCert({ title: "", subtitle: "", logo_path: "", certificate_link: "", alt_name: "", color_code: "#000000", sort_order: certs.length })}>
          + Add certification
        </button>
      </div>
      {certs.map((c) => <CertCard key={c.id} cert={c} onSave={saveCert} onDelete={deleteCert} />)}
    </>
  );
}

function CertCard({ cert, onSave, onDelete }) {
  const [data, setData] = useState(cert);
  const [open, setOpen] = useState(false);

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: data.color_code, border: "1px solid var(--border)" }} />
          <span style={{ fontWeight: 500 }}>{data.title || "Untitled"}</span>
        </div>
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
          {data.logo_path && (
            <div style={{ marginBottom: 12 }}>
              <img src={data.logo_path} alt="Preview" style={{ height: 80, borderRadius: 4 }} onError={(e) => e.target.style.display = "none"} />
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={() => onSave(data)}>Save</button>
            {cert.id && <button className="btn-danger" onClick={() => onDelete(cert.id)}>Delete</button>}
          </div>
        </div>
      )}
    </div>
  );
}
