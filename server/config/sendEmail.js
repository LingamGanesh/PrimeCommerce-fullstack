import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

let resendClient;

function getResendClient() {
  if (!process.env.RESEND_API) {
    throw new Error('Email service is not configured. Please set RESEND_API in the server .env file.');
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API);
  }

  return resendClient;
}

const sendEmail = async ({ sendTo, subject, html }) => {
  if (!sendTo || !subject || !html) {
    throw new Error('sendEmail requires sendTo, subject, and html.');
  }

  try {
    const resend = getResendClient();
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'PrimeCommerce <onboarding@resend.dev>',
      to: sendTo,
      subject,
      html,
    });

    if (data?.error) {
      throw new Error(data.error.message || 'Email provider rejected the message.');
    }

    return data;
  } catch (error) {
    console.error('Error sending email:', error.message || error);
    throw error;
  }
};

export default sendEmail;
