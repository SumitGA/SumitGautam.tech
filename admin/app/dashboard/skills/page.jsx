"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "../../../lib/supabase";
import { useToast } from "../../../components/useToast";

export default function SkillsPage() {
  const { show, Toast } = useToast();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await getSupabaseBrowser().from("skill_sections").select("*").order("sort_order");
    setSections(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveSection(sec) {
    const sb = getSupabaseBrowser();
    const { id, ...fields } = sec;
    const { error } = id
      ? await sb.from("skill_sections").update(fields).eq("id", id)
      : await sb.from("skill_sections").insert(fields);
    if (error) show(error.message, "error"); else { show("Saved!"); load(); }
  }

  async function deleteSection(id) {
    if (!confirm("Delete this skill section?")) return;
    const { error } = await getSupabaseBrowser().from("skill_sections").delete().eq("id", id);
    if (error) show(error.message, "error"); else { show("Deleted!"); load(); }
  }

  if (loading) return <div className="spinner" />;

  return (
    <>
      {Toast}
      <div className="page-header">
        <h1>Skills</h1>
        <button className="btn-primary"
          onClick={() => saveSection({ title: "New Section", file_name: "FullStackImg", skills: [], software_skills: [], sort_order: sections.length })}>
          + Add section
        </button>
      </div>
      {sections.map((sec) => <SkillSectionCard key={sec.id} section={sec} onSave={saveSection} onDelete={deleteSection} />)}
    </>
  );
}

function SkillSectionCard({ section, onSave, onDelete }) {
  const [data, setData] = useState({ ...section, skills: section.skills || [], software_skills: section.software_skills || [] });
  const [open, setOpen] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newSoftSkill, setNewSoftSkill] = useState({ skillName: "", fontAwesomeClassname: "", style: { color: "#ffffff" } });

  function addSkill() {
    if (!newSkill.trim()) return;
    setData((d) => ({ ...d, skills: [...d.skills, newSkill.trim()] }));
    setNewSkill("");
  }

  function removeSkill(i) {
    setData((d) => ({ ...d, skills: d.skills.filter((_, idx) => idx !== i) }));
  }

  function addSoftSkill() {
    if (!newSoftSkill.skillName.trim()) return;
    setData((d) => ({ ...d, software_skills: [...d.software_skills, { ...newSoftSkill }] }));
    setNewSoftSkill({ skillName: "", fontAwesomeClassname: "", style: { color: "#ffffff" } });
  }

  function removeSoftSkill(i) {
    setData((d) => ({ ...d, software_skills: d.software_skills.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <span style={{ fontWeight: 500 }}>{data.title}</span>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ marginTop: 16 }}>
          <div className="field">
            <label>Section title</label>
            <input value={data.title} onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))} />
          </div>
          <div className="field">
            <label>SVG illustration (FullStackImg or CloudInfraImg)</label>
            <select value={data.file_name} onChange={(e) => setData((d) => ({ ...d, file_name: e.target.value }))}>
              <option value="FullStackImg">FullStackImg</option>
              <option value="CloudInfraImg">CloudInfraImg</option>
            </select>
          </div>

          <div className="field">
            <label>Skill bullets</label>
            {data.skills.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                <input value={s} onChange={(e) => {
                  const arr = [...data.skills]; arr[i] = e.target.value;
                  setData((d) => ({ ...d, skills: arr }));
                }} />
                <button className="btn-danger" style={{ padding: "4px 8px", flexShrink: 0 }} onClick={() => removeSkill(i)}>✕</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <input value={newSkill} placeholder="⚡ New bullet…" onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} />
              <button className="btn-secondary" style={{ padding: "4px 10px", flexShrink: 0 }} onClick={addSkill}>Add</button>
            </div>
          </div>

          <div className="field">
            <label>Software skill icons ({data.software_skills.length} icons)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {data.software_skills.map((sk, i) => (
                <div key={i} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 8px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: sk.style?.color || "#fff", flexShrink: 0, display: "inline-block" }} />
                  {sk.skillName}
                  <button onClick={() => removeSoftSkill(i)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0, fontSize: 13, lineHeight: 1 }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 80px", gap: 6, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 12 }}>Skill name</label>
                <input value={newSoftSkill.skillName} placeholder="React" onChange={(e) => setNewSoftSkill((s) => ({ ...s, skillName: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12 }}>Iconify class</label>
                <input value={newSoftSkill.fontAwesomeClassname} placeholder="simple-icons:react" onChange={(e) => setNewSoftSkill((s) => ({ ...s, fontAwesomeClassname: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12 }}>Color</label>
                <input type="color" value={newSoftSkill.style.color} onChange={(e) => setNewSoftSkill((s) => ({ ...s, style: { color: e.target.value } }))} style={{ padding: 2, height: 38 }} />
              </div>
            </div>
            <button className="btn-secondary" style={{ marginTop: 6 }} onClick={addSoftSkill}>+ Add icon</button>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={() => onSave(data)}>Save section</button>
            {section.id && <button className="btn-danger" onClick={() => onDelete(section.id)}>Delete section</button>}
          </div>
        </div>
      )}
    </div>
  );
}
