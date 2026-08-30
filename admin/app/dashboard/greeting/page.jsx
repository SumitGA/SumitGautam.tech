"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "../../../lib/supabase";
import { useToast } from "../../../components/useToast";

const greetingFields = [
  { key: "title", label: "Title (headline)", placeholder: "Hello 👋." },
  { key: "title2", label: "Title 2 (your name)", placeholder: "Sumit Gautam" },
  { key: "logo_name", label: "Logo name (nav)", placeholder: "SumitGA()" },
  { key: "nickname", label: "Nickname", placeholder: "SumitGA / SG" },
  { key: "full_name", label: "Full name", placeholder: "Sumit Gautam" },
  { key: "subtitle", label: "Subtitle / tagline", placeholder: "Full Stack Developer…", textarea: true },
  { key: "resume_link", label: "Resume link (Google Drive URL)", placeholder: "https://drive.google.com/…" },
  { key: "mail", label: "Email address", placeholder: "you@example.com" },
];

const socialFields = [
  { key: "github", label: "GitHub URL" },
  { key: "linkedin", label: "LinkedIn URL" },
  { key: "gmail", label: "Gmail address" },
  { key: "twitter", label: "Twitter URL" },
  { key: "instagram", label: "Instagram URL" },
  { key: "bitbucket", label: "Bitbucket URL" },
  { key: "facebook", label: "Facebook URL" },
];

export default function GreetingPage() {
  const { show, Toast } = useToast();
  const [greeting, setGreeting] = useState({});
  const [social, setSocial] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    Promise.all([
      sb.from("greeting").select("*").eq("id", 1).single(),
      sb.from("social_media_links").select("*").eq("id", 1).single(),
    ]).then(([g, s]) => {
      if (g.data) setGreeting(g.data);
      if (s.data) setSocial(s.data);
      setLoading(false);
    });
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const sb = getSupabaseBrowser();
    const [r1, r2] = await Promise.all([
      sb.from("greeting").upsert({ id: 1, ...greeting }),
      sb.from("social_media_links").upsert({ id: 1, ...social }),
    ]);
    if (r1.error || r2.error) show(r1.error?.message || r2.error?.message, "error");
    else show("Saved successfully!");
    setSaving(false);
  }

  if (loading) return <div className="spinner" />;

  return (
    <>
      {Toast}
      <div className="page-header"><h1>Greeting &amp; Social Links</h1></div>
      <form onSubmit={save}>
        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 16, fontWeight: 600 }}>Greeting</h2>
          {greetingFields.map(({ key, label, placeholder, textarea }) => (
            <div className="field" key={key}>
              <label>{label}</label>
              {textarea ? (
                <textarea
                  value={greeting[key] || ""}
                  placeholder={placeholder}
                  onChange={(e) => setGreeting((g) => ({ ...g, [key]: e.target.value }))}
                />
              ) : (
                <input
                  value={greeting[key] || ""}
                  placeholder={placeholder}
                  onChange={(e) => setGreeting((g) => ({ ...g, [key]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>

        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 16, fontWeight: 600 }}>Social Media Links</h2>
          {socialFields.map(({ key, label }) => (
            <div className="field" key={key}>
              <label>{label}</label>
              <input
                value={social[key] || ""}
                onChange={(e) => setSocial((s) => ({ ...s, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </>
  );
}
