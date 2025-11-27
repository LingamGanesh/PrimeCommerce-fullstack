import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.RESEND_API) {
  console.error("Please provide RESEND_API in your .env file");
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API);

const sendEmail = async ({ sendTo, subject, html }) => {
  try {
    const data = await resend.emails.send({
      from: 'Binkeyit <onboarding@resend.dev>',
      to: sendTo,
      subject,
      html,
    });
    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export default sendEmail;
