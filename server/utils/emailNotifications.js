import { Resend } from "resend";

let resendClient;

export async function sendNotificationEmail({ to, subject, text, html }) {
  const apiKey = process.env.RESEND_API;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from || !to) return { sent: false, reason: "email_not_configured" };
  try {
    resendClient ||= new Resend(apiKey);
    const result = await resendClient.emails.send({ from, to, subject, text, ...(html ? { html } : {}) });
    if (result.error) { console.error("Notification email failed:", result.error.message); return { sent: false, reason: "provider_error" }; }
    return { sent: true };
  } catch (error) {
    console.error("Notification email failed:", error.message);
    return { sent: false, reason: "provider_error" };
  }
}

export function escapeEmailHtml(value) {
  return String(value || "").replace(/[&<>"\']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "\'": "&#39;" })[character]);
}