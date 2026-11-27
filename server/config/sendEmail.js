import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

let resendClient;
let configuredApiKey;

function getResendClient() {
  // Support both the name documented in .env.example and Resend's common
  // RESEND_API_KEY name so local environments do not silently miss the key.
  const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_API;

  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      "Email service is not configured. Add RESEND_API_KEY (or RESEND_API) to server/.env and restart the backend."
    );
  }

  if (!apiKey.startsWith("re_")) {
    throw new Error("Resend API key is invalid. Check RESEND_API_KEY in server/.env.");
  }

  // Re-create the client if the environment key changes during development.
  if (!resendClient || configuredApiKey !== apiKey) {
    configuredApiKey = apiKey;
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

const sendEmail = async ({ sendTo, subject, html }) => {
  if (
    typeof sendTo !== "string" ||
    !sendTo.trim() ||
    typeof subject !== "string" ||
    !subject.trim() ||
    typeof html !== "string" ||
    !html.trim()
  ) {
    throw new Error("sendEmail requires a valid sendTo, subject, and html.");
  }

  const from =
    process.env.EMAIL_FROM?.trim() ||
    "PrimeCommerce <onboarding@resend.dev>";

  try {
    const resend = getResendClient();
    const result = await resend.emails.send({
      from,
      to: sendTo.trim().toLowerCase(),
      subject,
      html,
    });

    // Resend returns provider errors in the response instead of always
    // throwing. Convert those into normal errors for the controllers.
    if (result?.error) {
      const providerMessage =
        result.error.message || result.error.name || "Unknown Resend error";
      throw new Error(`Resend rejected the email: ${providerMessage}`);
    }

    if (!result?.data?.id && !result?.id) {
      throw new Error("Resend did not confirm that the email was accepted.");
    }

    return result;
  } catch (error) {
    console.error("Email delivery failed:", error?.message || error);
    throw error;
  }
};

export default sendEmail;
