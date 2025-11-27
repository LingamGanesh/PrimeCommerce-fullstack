const verifyEmailTemplate = ({ name, url }) => {
  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f2f2f2; padding: 30px;">
    <div style="max-width: 650px; margin: auto; background: #ffffff; padding: 35px; border-radius: 12px; border: 1px solid #e5e5e5; box-shadow: 0 4px 20px rgba(0,0,0,0.08); background-image: linear-gradient(135deg, #fff 0%, #fdfdfd 100%);">

      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="margin: 0; font-size: 28px; color: #111; font-weight: 700;">
          Welcome to <span style="color:#FFD700;">BinkeyIT</span>
        </h1>
      </div>

      <p style="font-size: 17px; color:#333; line-height: 1.6;">
        Hello <b>${name}</b>,<br><br>
        Thank you for joining <b>BinkeyIT</b>.  
        To keep your account secure and activate your profile, please verify your email address.
      </p>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${url}" style="background-color: #FFD700; color: #000; padding: 14px 26px; text-decoration: none; font-size: 18px; border-radius: 8px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: inline-block;">
          Verify Email
        </a>
      </div>

      <p style="font-size: 15px; color:#555; line-height: 1.5;">
        If the button above doesn’t work, copy and paste the following link into your browser:
      </p>

      <div style="background:#fafafa; padding: 12px; border-radius: 6px; border: 1px solid #e6e6e6; font-size: 14px; word-break: break-all; color: #333; margin-bottom: 30px;">
        ${url}
      </div>

      <p style="font-size: 14px; color:#777; line-height: 1.5;">
        If you did not create this account, you can safely ignore this email.
      </p>

      <p style="font-size: 15px; color:#333; margin-top: 30px;">
        Warm Regards,<br>
        <b style="color:#FFD700;">BinkeyIT Support Team</b>
      </p>

    </div>
  </div>
  `;
};

export default verifyEmailTemplate;
