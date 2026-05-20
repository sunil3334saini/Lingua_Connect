const nodemailer = require("nodemailer");

/**
 * Reusable email service.
 *
 * Env vars required:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 *
 * Usage:
 *   const { sendMail } = require("../services/email.service");
 *   await sendMail({ to: "a@b.com", subject: "Hi", html: "<p>Hello</p>" });
 */

let transporter = null;

/**
 * Lazy-initialise the SMTP transporter so the app boots even when
 * SMTP credentials are not yet configured (e.g. in development).
 */
const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === "true", // true for 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

/**
 * Send an email.
 *
 * @param {Object} options
 * @param {string|string[]} options.to
 * @param {string} options.subject
 * @param {string} [options.text]   - Plain-text body
 * @param {string} [options.html]   - HTML body (takes precedence)
 * @param {string} [options.from]   - Override default sender
 * @returns {Promise<import("nodemailer").SentMessageInfo>}
 */
/**
 * Verify SMTP connection on startup (call once, non-blocking).
 */
const verifyTransporter = () => {
  if (!isSmtpConfigured()) {
    console.warn("⚠️  SMTP not configured — emails will be printed to console (dev mode).");
    return;
  }
  getTransporter().verify((err) => {
    if (err) console.error("❌ SMTP connection failed:", err.message);
    else console.log("✅ SMTP connection verified");
  });
};

const isSmtpConfigured = () =>
  process.env.SMTP_USER &&
  !process.env.SMTP_USER.includes("your_gmail") &&
  process.env.SMTP_PASS &&
  !process.env.SMTP_PASS.includes("xxxx");

const sendMail = async ({ to, subject, text, html, from }) => {
  // In development with no valid SMTP, print to console instead of crashing
  if (!isSmtpConfigured()) {
    console.log("\n─────────────────────────────────────────────");
    console.log("📧  [DEV EMAIL — not sent, SMTP not configured]");
    console.log(`To      : ${Array.isArray(to) ? to.join(", ") : to}`);
    console.log(`Subject : ${subject}`);
    if (text) console.log(`Body    : ${text.slice(0, 300)}`);
    console.log("─────────────────────────────────────────────\n");
    return { messageId: "dev-console" };
  }

  const info = await getTransporter().sendMail({
    from: from || process.env.EMAIL_FROM || `"Lingua Connect" <noreply@linguaconnect.com>`,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    text,
    html,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(`📧 Email sent: ${info.messageId}`);
  }

  return info;
};

module.exports = { sendMail, getTransporter, verifyTransporter };
