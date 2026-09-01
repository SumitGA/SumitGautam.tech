"use client";
import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "../../../lib/supabase";
import { useToast } from "../../../components/useToast";

// ─── helpers ─────────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: 24,
      marginBottom: 28,
    }}>
      <h2 style={{ margin: "0 0 18px", fontSize: 16 }}>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, multiline, rows = 3 }) {
  const base = {
    width: "100%",
    padding: "8px 12px",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text)",
    fontSize: 14,
    fontFamily: "inherit",
    boxSizing: "border-box",
  };
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
        {label}
      </span>
      {multiline ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...base, resize: "vertical" }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={base}
        />
      )}
    </label>
  );
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        flex: 1,
        padding: "8px 12px",
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        color: "var(--text)",
        fontSize: 14,
        fontFamily: "inherit",
      }}
    />
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ResumePage() {
  const { show, Toast } = useToast();

  const [header, setHeader] = useState({
    full_name: "", title: "", phone: "", email: "", location: "", website: "", note: "",
  });
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [education, setEducation] = useState([]);
  const [certifications, setCertifications] = useState("");
  const [references, setReferences] = useState("");
  const [loading, setLoading] = useState(true);
  const [openJobs, setOpenJobs] = useState({});
  const [openEdu, setOpenEdu] = useState({});

  useEffect(() => {
    async function load() {
      const sb = getSupabaseBrowser();
      const [hRes, sRes, skRes, jRes, eRes, certRes, rRes] = await Promise.all([
        sb.from("resume_header").select("*").eq("id", 1).single(),
        sb.from("resume_summary").select("*").eq("id", 1).single(),
        sb.from("resume_skills").select("*").order("sort_order"),
        sb.from("resume_jobs").select("*").order("sort_order"),
        sb.from("resume_education_entries").select("*").order("sort_order"),
        sb.from("resume_certifications").select("*").eq("id", 1).single(),
        sb.from("resume_references").select("*").eq("id", 1).single(),
      ]);
      if (hRes.data) setHeader({ ...{ website: "", note: "" }, ...hRes.data });
      if (sRes.data) setSummary(sRes.data.content);
      if (skRes.data) setSkills(skRes.data);
      if (jRes.data) setJobs(jRes.data.map((j) => ({
        ...j,
        company_description: j.company_description ?? "",
        stack_line: j.stack_line ?? "",
        bullets: Array.isArray(j.bullets) ? j.bullets : [],
      })));
      if (eRes.data) setEducation(eRes.data);
      if (certRes.data) setCertifications(certRes.data.content ?? "");
      if (rRes.data) setReferences(rRes.data.content ?? "");
      setLoading(false);
    }
    load();
  }, []);

  // ─── save helpers ──────────────────────────────────────────────────────────

  async function saveHeader() {
    const { error } = await getSupabaseBrowser()
      .from("resume_header")
      .upsert({ ...header, id: 1 });
    show(error ? `Error: ${error.message}` : "Header saved", error ? "error" : "success");
  }

  async function saveSummary() {
    const { error } = await getSupabaseBrowser()
      .from("resume_summary")
      .upsert({ id: 1, content: summary });
    show(error ? `Error: ${error.message}` : "Summary saved", error ? "error" : "success");
  }

  async function saveSkills() {
    await getSupabaseBrowser().from("resume_skills").delete().neq("id", 0);
    const rows = skills.map((s, i) => ({
      category: s.category,
      skill_text: s.skill_text,
      sort_order: i,
    }));
    const { error } = await getSupabaseBrowser().from("resume_skills").insert(rows);
    if (!error) {
      const { data } = await getSupabaseBrowser().from("resume_skills").select("*").order("sort_order");
      if (data) setSkills(data);
    }
    show(error ? `Error: ${error.message}` : "Skills saved", error ? "error" : "success");
  }

  async function saveJob(job) {
    const payload = {
      job_title: job.job_title,
      company: job.company,
      location: job.location,
      date_range: job.date_range,
      company_description: job.company_description,
      bullets: job.bullets,
      stack_line: job.stack_line,
      sort_order: job.sort_order,
    };
    if (job.id) {
      const { error } = await getSupabaseBrowser().from("resume_jobs").update(payload).eq("id", job.id);
      show(error ? `Error: ${error.message}` : "Job saved", error ? "error" : "success");
    } else {
      const { error, data } = await getSupabaseBrowser().from("resume_jobs").insert([payload]).select().single();
      if (!error && data) setJobs((prev) => prev.map((j) => (!j.id ? data : j)));
      show(error ? `Error: ${error.message}` : "Job saved", error ? "error" : "success");
    }
  }

  async function deleteJob(id) {
    if (!id) { setJobs((prev) => prev.filter((j) => j.id)); return; }
    const { error } = await getSupabaseBrowser().from("resume_jobs").delete().eq("id", id);
    if (!error) setJobs((prev) => prev.filter((j) => j.id !== id));
    show(error ? `Error: ${error.message}` : "Job deleted", error ? "error" : "success");
  }

  async function saveEduEntry(entry) {
    const payload = {
      degree: entry.degree,
      institution: entry.institution,
      graduated: entry.graduated,
      sort_order: entry.sort_order,
    };
    if (entry.id) {
      const { error } = await getSupabaseBrowser().from("resume_education_entries").update(payload).eq("id", entry.id);
      show(error ? `Error: ${error.message}` : "Education saved", error ? "error" : "success");
    } else {
      const { error, data } = await getSupabaseBrowser().from("resume_education_entries").insert([payload]).select().single();
      if (!error && data) setEducation((prev) => prev.map((e) => (!e.id ? data : e)));
      show(error ? `Error: ${error.message}` : "Education saved", error ? "error" : "success");
    }
  }

  async function deleteEdu(id) {
    if (!id) { setEducation((prev) => prev.filter((e) => e.id)); return; }
    const { error } = await getSupabaseBrowser().from("resume_education_entries").delete().eq("id", id);
    if (!error) setEducation((prev) => prev.filter((e) => e.id !== id));
    show(error ? `Error: ${error.message}` : "Deleted", error ? "error" : "success");
  }

  async function saveCertifications() {
    const { error } = await getSupabaseBrowser()
      .from("resume_certifications")
      .upsert({ id: 1, content: certifications });
    show(error ? `Error: ${error.message}` : "Certifications saved", error ? "error" : "success");
  }

  async function saveReferences() {
    const { error } = await getSupabaseBrowser()
      .from("resume_references")
      .upsert({ id: 1, content: references });
    show(error ? `Error: ${error.message}` : "References saved", error ? "error" : "success");
  }

  // ─── local mutators ────────────────────────────────────────────────────────

  function updateSkill(idx, field, val) {
    setSkills((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  }

  function addSkill() {
    setSkills((prev) => [...prev, { category: "", skill_text: "", sort_order: prev.length }]);
  }

  function removeSkill(idx) {
    setSkills((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateJob(idx, field, value) {
    setJobs((prev) => prev.map((j, i) => i === idx ? { ...j, [field]: value } : j));
  }

  function updateBullet(jobIdx, bulletIdx, text) {
    setJobs((prev) => prev.map((j, i) => {
      if (i !== jobIdx) return j;
      const bullets = [...j.bullets];
      bullets[bulletIdx] = text;
      return { ...j, bullets };
    }));
  }

  function addBullet(jobIdx) {
    setJobs((prev) => prev.map((j, i) =>
      i !== jobIdx ? j : { ...j, bullets: [...j.bullets, ""] }
    ));
  }

  function removeBullet(jobIdx, bulletIdx) {
    setJobs((prev) => prev.map((j, i) =>
      i !== jobIdx ? j : { ...j, bullets: j.bullets.filter((_, bi) => bi !== bulletIdx) }
    ));
  }

  function addJob() {
    setJobs((prev) => [...prev, {
      job_title: "", company: "", location: "", date_range: "",
      company_description: "", bullets: [], stack_line: "",
      sort_order: prev.length,
    }]);
  }

  function updateEdu(idx, field, value) {
    setEducation((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  }

  function addEdu() {
    setEducation((prev) => [...prev, {
      degree: "", institution: "", graduated: "", sort_order: prev.length,
    }]);
  }

  // ─── render ─────────────────────────────────────────────────────────────────

  if (loading) return <p style={{ color: "var(--muted)" }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 820 }}>
      {Toast}
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Resume / CV</h1>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 28 }}>
        Changes save to Supabase and appear on <a href="https://sumitgautam.tech/resume" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>sumitgautam.tech/resume</a>
      </p>

      {/* Header */}
      <Section title="Header">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Full Name" value={header.full_name} onChange={(v) => setHeader({ ...header, full_name: v })} />
          <Field label="Title / Role" value={header.title} onChange={(v) => setHeader({ ...header, title: v })} />
          <Field label="Phone" value={header.phone} onChange={(v) => setHeader({ ...header, phone: v })} />
          <Field label="Email" value={header.email} onChange={(v) => setHeader({ ...header, email: v })} />
          <Field label="Location" value={header.location} onChange={(v) => setHeader({ ...header, location: v })} />
          <Field label="Website" value={header.website} onChange={(v) => setHeader({ ...header, website: v })} />
        </div>
        <Field label="Note (e.g. visa / working rights)" value={header.note} onChange={(v) => setHeader({ ...header, note: v })} />
        <button className="btn-primary" onClick={saveHeader}>Save Header</button>
      </Section>

      {/* Summary */}
      <Section title="Professional Summary">
        <Field label="Summary" value={summary} onChange={setSummary} multiline rows={5} />
        <button className="btn-primary" onClick={saveSummary}>Save Summary</button>
      </Section>

      {/* Skills */}
      <Section title="Technical Skills">
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
          Each row is one category line. Leave Category blank for uncategorized bullet text.
        </p>
        {skills.map((s, idx) => (
          <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              <input
                type="text"
                placeholder="Category (e.g. Languages)"
                value={s.category}
                onChange={(e) => updateSkill(idx, "category", e.target.value)}
                style={{
                  padding: "7px 12px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "var(--text)",
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
              />
              <input
                type="text"
                placeholder="Skill text"
                value={s.skill_text}
                onChange={(e) => updateSkill(idx, "skill_text", e.target.value)}
                style={{
                  padding: "7px 12px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "var(--text)",
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
              />
            </div>
            <button
              className="btn-secondary"
              style={{ padding: "7px 12px", alignSelf: "center" }}
              onClick={() => removeSkill(idx)}
            >
              ✕
            </button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button className="btn-secondary" onClick={addSkill}>+ Add Row</button>
          <button className="btn-primary" onClick={saveSkills}>Save All Skills</button>
        </div>
      </Section>

      {/* Experience */}
      <Section title="Experience">
        {jobs.map((job, idx) => {
          const open = openJobs[idx] !== false;
          return (
            <div key={idx} style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              marginBottom: 14,
              overflow: "hidden",
            }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  cursor: "pointer",
                  background: "var(--bg)",
                }}
                onClick={() => setOpenJobs((p) => ({ ...p, [idx]: !open }))}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  {job.job_title || "(new)"}{job.company ? ` — ${job.company}` : ""}
                </span>
                <span style={{ color: "var(--muted)", fontSize: 18 }}>{open ? "▲" : "▼"}</span>
              </div>
              {open && (
                <div style={{ padding: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Job Title" value={job.job_title} onChange={(v) => updateJob(idx, "job_title", v)} />
                    <Field label="Date Range" value={job.date_range} onChange={(v) => updateJob(idx, "date_range", v)} />
                    <Field label="Company" value={job.company} onChange={(v) => updateJob(idx, "company", v)} />
                    <Field label="Location" value={job.location} onChange={(v) => updateJob(idx, "location", v)} />
                  </div>
                  <Field
                    label="Company Description (optional — shown in italic below company name)"
                    value={job.company_description}
                    onChange={(v) => updateJob(idx, "company_description", v)}
                    multiline rows={2}
                  />
                  <Field
                    label="Stack line (shown at bottom of entry)"
                    value={job.stack_line}
                    onChange={(v) => updateJob(idx, "stack_line", v)}
                  />

                  <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, marginTop: 4 }}>Bullet Points</p>
                  {job.bullets.map((b, bi) => (
                    <div key={bi} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <textarea
                        rows={2}
                        value={b}
                        onChange={(e) => updateBullet(idx, bi, e.target.value)}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          color: "var(--text)",
                          fontSize: 13,
                          fontFamily: "inherit",
                          resize: "vertical",
                        }}
                      />
                      <button
                        className="btn-secondary"
                        style={{ alignSelf: "flex-start", padding: "6px 10px" }}
                        onClick={() => removeBullet(idx, bi)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button className="btn-secondary" style={{ marginBottom: 14 }} onClick={() => addBullet(idx)}>
                    + Add Bullet
                  </button>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn-primary" onClick={() => saveJob(job)}>Save Job</button>
                    <button
                      className="btn-secondary"
                      style={{ color: "#e74c3c", borderColor: "#e74c3c" }}
                      onClick={() => deleteJob(job.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <button className="btn-secondary" onClick={addJob}>+ Add Job</button>
      </Section>

      {/* Education */}
      <Section title="Education">
        {education.map((entry, idx) => {
          const open = openEdu[idx] !== false;
          return (
            <div key={idx} style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              marginBottom: 14,
              overflow: "hidden",
            }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  cursor: "pointer",
                  background: "var(--bg)",
                }}
                onClick={() => setOpenEdu((p) => ({ ...p, [idx]: !open }))}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  {entry.degree || "(new entry)"}
                </span>
                <span style={{ color: "var(--muted)", fontSize: 18 }}>{open ? "▲" : "▼"}</span>
              </div>
              {open && (
                <div style={{ padding: "16px" }}>
                  <Field label="Degree" value={entry.degree} onChange={(v) => updateEdu(idx, "degree", v)} />
                  <Field label="Institution" value={entry.institution} onChange={(v) => updateEdu(idx, "institution", v)} />
                  <Field label="Year" value={entry.graduated} onChange={(v) => updateEdu(idx, "graduated", v)} />
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn-primary" onClick={() => saveEduEntry(entry)}>Save</button>
                    <button
                      className="btn-secondary"
                      style={{ color: "#e74c3c", borderColor: "#e74c3c" }}
                      onClick={() => deleteEdu(entry.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <button className="btn-secondary" onClick={addEdu}>+ Add Entry</button>
      </Section>

      {/* Certifications */}
      <Section title="Certifications">
        <Field label="Certifications (comma- or · separated)" value={certifications} onChange={setCertifications} />
        <button className="btn-primary" onClick={saveCertifications}>Save</button>
      </Section>

      {/* References */}
      <Section title="References">
        <Field label="References text" value={references} onChange={setReferences} />
        <button className="btn-primary" onClick={saveReferences}>Save</button>
      </Section>
    </div>
  );
}
