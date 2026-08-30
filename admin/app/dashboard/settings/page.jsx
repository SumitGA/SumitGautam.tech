"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "../../../lib/supabase";
import { useToast } from "../../../components/useToast";

export default function SettingsPage() {
  const { show, Toast } = useToast();
  const [settings, setSettings] = useState({ is_splash: true, use_custom_cursor: false, google_tracking_id: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSupabaseBrowser().from("settings").select("*").eq("id", 1).single().then(({ data }) => {
      if (data) setSettings(data);
      setLoading(false);
    });
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await getSupabaseBrowser().from("settings").upsert({ id: 1, ...settings });
    if (error) show(error.message, "error");
    else show("Saved!");
    setSaving(false);
  }

  if (loading) return <div className="spinner" />;

  return (
    <>
      {Toast}
      <div className="page-header"><h1>Settings</h1></div>
      <form onSubmit={save}>
        <div className="card">
          <div className="field" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="checkbox"
              id="isSplash"
              style={{ width: "auto" }}
              checked={settings.is_splash}
              onChange={(e) => setSettings((s) => ({ ...s, is_splash: e.target.checked }))}
            />
            <label htmlFor="isSplash" style={{ marginBottom: 0 }}>Show splash screen on load</label>
          </div>
          <div className="field" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="checkbox"
              id="cursor"
              style={{ width: "auto" }}
              checked={settings.use_custom_cursor}
              onChange={(e) => setSettings((s) => ({ ...s, use_custom_cursor: e.target.checked }))}
            />
            <label htmlFor="cursor" style={{ marginBottom: 0 }}>Use custom cursor</label>
          </div>
          <div className="field">
            <label>Google Analytics tracking ID</label>
            <input
              value={settings.google_tracking_id || ""}
              placeholder="UA-XXXXXXXXX-X"
              onChange={(e) => setSettings((s) => ({ ...s, google_tracking_id: e.target.value }))}
            />
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>
    </>
  );
}
