"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "../../../lib/supabase";
import { useToast } from "../../../components/useToast";

const fields = [
  { key: "title", label: "Contact section title" },
  { key: "profile_image_path", label: "Profile image filename (in /images/)", placeholder: "profile_picture.jpeg" },
  { key: "description", label: "Contact description", textarea: true },
  { key: "blog_title", label: "Blog section title" },
  { key: "blog_subtitle", label: "Blog subtitle", textarea: true },
  { key: "blog_link", label: "Blog / Twitter link" },
];

export default function ContactPage() {
  const { show, Toast } = useToast();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSupabaseBrowser().from("contact").select("*").eq("id", 1).single().then(({ data }) => {
      if (data) setData(data);
      setLoading(false);
    });
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await getSupabaseBrowser().from("contact").upsert({ id: 1, ...data });
    if (error) show(error.message, "error");
    else show("Saved!");
    setSaving(false);
  }

  if (loading) return <div className="spinner" />;

  return (
    <>
      {Toast}
      <div className="page-header"><h1>Contact</h1></div>
      <form onSubmit={save}>
        <div className="card">
          {fields.map(({ key, label, placeholder, textarea }) => (
            <div className="field" key={key}>
              <label>{label}</label>
              {textarea ? (
                <textarea
                  value={data[key] || ""}
                  placeholder={placeholder}
                  onChange={(e) => setData((d) => ({ ...d, [key]: e.target.value }))}
                />
              ) : (
                <input
                  value={data[key] || ""}
                  placeholder={placeholder}
                  onChange={(e) => setData((d) => ({ ...d, [key]: e.target.value }))}
                />
              )}
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
