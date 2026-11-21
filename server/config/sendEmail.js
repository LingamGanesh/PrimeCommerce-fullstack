import { Resend } from "resend";

const sendEmail = async ({ sendTo, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_API;
  const from = process.env.EMAIL_FROM || "PrimeCommerce <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("Email service is not configured. Set RESEND_API_KEY.");
  }
  if (!sendTo || !subject || !html) {
    throw new Error("Recipient, subject and email content are required.");
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({ from, to: sendTo, subject, html });
  if (result.error) {
    console.error("Email provider rejected the message:", result.error.message);
    throw new Error("Unable to send email right now.");
  }
  return result;
};

export default sendEmail;
