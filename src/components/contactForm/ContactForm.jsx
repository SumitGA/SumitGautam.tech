"use client";
import { useState } from "react";
import "./ContactForm.css";
import { track } from "../../../lib/analytics-client";

const INITIAL = { name: "", email: "", subject: "", message: "" };

export default function ContactForm({ theme }) {
  const [fields, setFields] = useState(INITIAL);
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  function set(field) {
    return (e) => setFields((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await res.json();
    if (res.ok) {
      setStatus("success");
      track("contact_submit");
      setFields(INITIAL);
    } else {
      setStatus("error");
      setErrorMsg(data.error || "Something went wrong. Please try again.");
    }
  }

  const accentColor = theme?.accentBright || "#1a73e8";

  return (
    <div className="cf-wrapper">
      <h2 className="cf-heading" style={{ color: theme?.text }}>
        Send a Message
      </h2>

      {status === "success" ? (
        <div className="cf-success">
          <span className="cf-success-icon">✓</span>
          <p>Message sent! I will get back to you soon.</p>
        </div>
      ) : (
        <form className="cf-form" onSubmit={handleSubmit} noValidate>
          <div className="cf-row cf-row-2">
            <div className="cf-field">
              <label className="cf-label" style={{ color: theme?.text }}>
                Name *
              </label>
              <input
                className="cf-input"
                type="text"
                value={fields.name}
                onChange={set("name")}
                placeholder="Your name"
                required
                disabled={status === "loading"}
              />
            </div>
            <div className="cf-field">
              <label className="cf-label" style={{ color: theme?.text }}>
                Email *
              </label>
              <input
                className="cf-input"
                type="email"
                value={fields.email}
                onChange={set("email")}
                placeholder="your@email.com"
                required
                disabled={status === "loading"}
              />
            </div>
          </div>

          <div className="cf-field">
            <label className="cf-label" style={{ color: theme?.text }}>
              Subject
            </label>
            <input
              className="cf-input"
              type="text"
              value={fields.subject}
              onChange={set("subject")}
              placeholder="What is this about?"
              disabled={status === "loading"}
            />
          </div>

          <div className="cf-field">
            <label className="cf-label" style={{ color: theme?.text }}>
              Message *
            </label>
            <textarea
              className="cf-input cf-textarea"
              value={fields.message}
              onChange={set("message")}
              placeholder="Write your message here..."
              rows={5}
              required
              disabled={status === "loading"}
            />
          </div>

          {status === "error" && (
            <p className="cf-error">{errorMsg}</p>
          )}

          <button
            className="cf-submit"
            type="submit"
            disabled={status === "loading"}
            style={{ backgroundColor: accentColor }}
          >
            {status === "loading" ? "Sending…" : "Send Message"}
          </button>
        </form>
      )}
    </div>
  );
}
