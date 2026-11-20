const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[character]);

const forgotPasswordTemplate = ({ name, otp }) => `
<div style="font-family: Arial, sans-serif; color: #1f2937;">
  <p>Hello ${escapeHtml(name)},</p>
  <p>You requested a password reset for your PrimeCommerce account. Use this one-time code to continue:</p>
  <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; font-size:24px; letter-spacing:6px; padding:18px; text-align:center; font-weight:800;">
    ${escapeHtml(otp)}
  </div>
  <p>This code expires in 10 minutes. If you did not request a password reset, you can ignore this email.</p>
  <p>PrimeCommerce Support</p>
</div>
`;

export default forgotPasswordTemplate;
