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
const sendMail = async ({ to, subject, text, html, from }) => {
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

module.exports = { sendMail, getTransporter };
