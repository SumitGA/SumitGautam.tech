import { NextResponse } from "next/server";
import { Resend } from "resend";
import { checkRateLimit } from "../../../lib/rate-limit";

/* Every accepted submission sends an email, so an unprotected endpoint is not
   just noise — it burns the Resend daily quota, after which genuine enquiries
   fail silently. Hence a rate limit, a honeypot and hard length caps. */
const RATE_LIMIT = Number(process.env.CONTACT_RATE_LIMIT || 3);
const RATE_WINDOW_SECONDS = Number(process.env.CONTACT_RATE_WINDOW_SECONDS || 3600);

const MAX = { name: 100, email: 200, subject: 200, message: 5000 };

// Deliberately permissive. Real addresses are stranger than most patterns
// allow, and Resend rejects genuinely undeliverable ones anyway; this only
// catches input that is obviously not an address.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { name, email, subject, message, website } = body;

  /* Honeypot. A field hidden from people but filled by most form bots. Answer
     200 rather than an error: telling a bot it was detected just teaches it
     which field to skip next time. */
  if (typeof website === "string" && website.trim()) {
    return NextResponse.json({ success: true });
  }

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Name, email and message are required." },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "That email address looks invalid." }, { status: 400 });
  }

  for (const [field, cap] of Object.entries(MAX)) {
    const value = body[field];
    if (typeof value === "string" && value.length > cap) {
      return NextResponse.json(
        { error: `${field[0].toUpperCase()}${field.slice(1)} is too long (max ${cap} characters).` },
        { status: 400 }
      );
    }
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured." }, { status: 503 });
  }

  const allowed = await checkRateLimit(req, {
    bucket: "contact",
    limit: RATE_LIMIT,
    windowSeconds: RATE_WINDOW_SECONDS,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "You've sent several messages already. Please try again later." },
      { status: 429 }
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "sumitga@sumitgautam.tech";
  const FROM_EMAIL =
    process.env.RESEND_FROM_EMAIL || "Portfolio Contact <onboarding@resend.dev>";

  const emailSubject = subject?.trim()
    ? `[Portfolio] ${subject.trim()}`
    : `[Portfolio] Message from ${name.trim()}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
      <h2 style="color:#1a73e8;border-bottom:2px solid #1a73e8;padding-bottom:8px">
        New portfolio contact message
      </h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <tr>
          <td style="padding:8px 12px;background:#f4f4f4;font-weight:bold;width:100px">Name</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">${escapeHtml(name)}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f4f4f4;font-weight:bold">Email</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">
            <a href="mailto:${escapeHtml(email)}" style="color:#1a73e8">${escapeHtml(email)}</a>
          </td>
        </tr>
        ${
          subject?.trim()
            ? `<tr>
          <td style="padding:8px 12px;background:#f4f4f4;font-weight:bold">Subject</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">${escapeHtml(subject)}</td>
        </tr>`
            : ""
        }
      </table>
      <h3 style="color:#3c3c3c;margin-bottom:8px">Message</h3>
      <div style="background:#f9f9f9;border-left:4px solid #1a73e8;padding:16px;border-radius:0 4px 4px 0;white-space:pre-wrap">${escapeHtml(message)}</div>
      <p style="color:#888;font-size:12px;margin-top:24px">
        Sent via the contact form at sumitgautam.tech — reply directly to this email to respond.
      </p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    replyTo: email,
    subject: emailSubject,
    html,
  });

  if (error) {
    console.error("[contact/route] Resend error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
