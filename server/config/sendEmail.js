import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = process.env.RESEND_API ? new Resend(process.env.RESEND_API) : null;

const sendEmail = async ({ sendTo, subject, html }) => {
  if (!resend) {
    throw new Error("Email service is not configured. Set RESEND_API to enable email delivery.");
  }

  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Binkeyit <onboarding@resend.dev>',
      to: sendTo,
      subject,
      html,
    });
    if (data.error) throw new Error(data.error.message || "Email delivery failed");
    console.log('Email sent successfully');
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export default sendEmail;
