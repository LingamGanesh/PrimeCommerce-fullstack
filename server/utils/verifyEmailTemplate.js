const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[character]);

const verifyEmailTemplate = ({ name, url }) => {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(url);
  return `
  <div style="font-family: Arial, sans-serif; background:#f7f8f3; padding:30px;">
    <div style="max-width:600px; margin:auto; background:#fff; padding:32px; border-radius:12px;">
      <h1 style="color:#123d2a; text-align:center;">Welcome to PrimeCommerce</h1>
      <p>Hello <strong>${safeName}</strong>,</p>
      <p>Thanks for creating a PrimeCommerce account. Verify your email address to activate your account.</p>
      <p style="text-align:center; margin:32px 0;">
        <a href="${safeUrl}" style="background:#176b36; color:#fff; padding:14px 24px; border-radius:8px; text-decoration:none; font-weight:700;">Verify email</a>
      </p>
      <p>If the button does not work, copy this link into your browser:</p>
      <p style="word-break:break-all;">${safeUrl}</p>
      <p>If you did not create this account, ignore this message.</p>
      <p>PrimeCommerce Support</p>
    </div>
  </div>`;
};

export default verifyEmailTemplate;
