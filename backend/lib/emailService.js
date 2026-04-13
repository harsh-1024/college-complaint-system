const nodemailer = require("nodemailer");

function parseBoolean(value, defaultValue = false) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return defaultValue;
  return value.trim().toLowerCase() === "true";
}

function getSmtpConfig() {
  const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = parseBoolean(process.env.SMTP_SECURE, false);
  const user = (process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();
  const from = (process.env.MAIL_FROM || user || "no-reply@college-complaints.local").trim();

  return { host, port, secure, user, pass, from };
}

function isEmailServiceConfigured() {
  const config = getSmtpConfig();
  return Boolean(config.user && config.pass);
}

function createTransport() {
  const config = getSmtpConfig();

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });
}

function formatExpiryForEmail(expiresAt) {
  try {
    return new Date(expiresAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  } catch (_error) {
    return expiresAt;
  }
}

async function sendPasswordResetEmail({ to, resetCode, expiresAt }) {
  if (!isEmailServiceConfigured()) {
    return { sent: false, reason: "EMAIL_NOT_CONFIGURED" };
  }

  const config = getSmtpConfig();
  const transporter = createTransport();
  const expiry = formatExpiryForEmail(expiresAt);

  const subject = "Password reset code - Indore Complaint Portal";
  const text = [
    "You requested a password reset.",
    `Your reset code is: ${resetCode}`,
    `This code expires at: ${expiry} (IST)`,
    "If you did not request this, you can ignore this email."
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #12263a;">
      <h2 style="margin-bottom: 8px;">Password Reset Code</h2>
      <p>You requested a password reset for your Indore Complaint Portal account.</p>
      <p style="font-size: 18px;"><strong>Code: ${resetCode}</strong></p>
      <p>This code expires at <strong>${expiry}</strong> (IST).</p>
      <p>If you did not request this reset, you can safely ignore this email.</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: config.from,
    to,
    subject,
    text,
    html
  });

  return { sent: true, messageId: info.messageId };
}

module.exports = {
  isEmailServiceConfigured,
  sendPasswordResetEmail
};
