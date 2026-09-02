import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "sumitga@sumitgautam.tech";
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Portfolio Contact <onboarding@resend.dev>";

export async function POST(req) {
  const { name, email, subject, message } = await req.json();

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Name, email and message are required." },
      { status: 400 }
    );
  }

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
