/**
 * Reusable, composable email templates.
 *
 * Every export returns { subject, html } ready for sendMail().
 * Templates use a shared layout wrapper for consistent branding.
 */

// ── Shared layout ──────────────────────────────────────────────
const APP_NAME = "Lingua Connect";
const PRIMARY_COLOR = "#4F46E5";

const layout = (title, body) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:${PRIMARY_COLOR};padding:24px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;">${APP_NAME}</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 24px;">
          <h2 style="margin:0 0 16px;color:#1f2937;font-size:20px;">${title}</h2>
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 24px;text-align:center;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;">
          &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const p = (text) => `<p style="margin:0 0 12px;color:#374151;line-height:1.6;">${text}</p>`;
const btn = (url, label) =>
  `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="background:${PRIMARY_COLOR};border-radius:6px;padding:12px 24px;">
      <a href="${url}" style="color:#ffffff;text-decoration:none;font-weight:bold;">${label}</a>
    </td></tr>
  </table>`;

// ── Templates ──────────────────────────────────────────────────

/** Welcome email after registration */
const welcome = ({ name }) => ({
  subject: `Welcome to ${APP_NAME}, ${name}!`,
  html: layout(
    `Welcome, ${name}! 🎉`,
    p(`Thanks for joining ${APP_NAME}. We're excited to help you on your learning journey.`) +
      p("You can browse teachers, book sessions, and start learning right away.") +
      btn(process.env.CLIENT_URL || "http://localhost:3000", "Get Started")
  ),
});

/** Booking confirmation sent to student */
const bookingConfirmation = ({ studentName, teacherName, subject, sessionDate, sessionTime, duration, amount }) => ({
  subject: `Booking Confirmed — ${subject} with ${teacherName}`,
  html: layout(
    "Booking Confirmed ✅",
    p(`Hi ${studentName},`) +
      p(`Your session has been booked successfully:`) +
      `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;color:#6b7280;">Teacher</td><td style="padding:8px;font-weight:bold;">${teacherName}</td></tr>
        <tr><td style="padding:8px;color:#6b7280;">Subject</td><td style="padding:8px;">${subject}</td></tr>
        <tr><td style="padding:8px;color:#6b7280;">Date</td><td style="padding:8px;">${sessionDate}</td></tr>
        <tr><td style="padding:8px;color:#6b7280;">Time</td><td style="padding:8px;">${sessionTime}</td></tr>
        <tr><td style="padding:8px;color:#6b7280;">Duration</td><td style="padding:8px;">${duration} min</td></tr>
        <tr><td style="padding:8px;color:#6b7280;">Amount</td><td style="padding:8px;">₹${amount}</td></tr>
      </table>` +
      btn(`${process.env.CLIENT_URL || "http://localhost:3000"}/bookings`, "View Bookings")
  ),
});

/** Notification to teacher about a new booking */
const newBookingTeacher = ({ teacherName, studentName, subject, sessionDate, sessionTime }) => ({
  subject: `New Booking — ${subject} from ${studentName}`,
  html: layout(
    "New Booking 📚",
    p(`Hi ${teacherName},`) +
      p(`You have a new booking request:`) +
      `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;color:#6b7280;">Student</td><td style="padding:8px;font-weight:bold;">${studentName}</td></tr>
        <tr><td style="padding:8px;color:#6b7280;">Subject</td><td style="padding:8px;">${subject}</td></tr>
        <tr><td style="padding:8px;color:#6b7280;">Date</td><td style="padding:8px;">${sessionDate}</td></tr>
        <tr><td style="padding:8px;color:#6b7280;">Time</td><td style="padding:8px;">${sessionTime}</td></tr>
      </table>` +
      btn(`${process.env.CLIENT_URL || "http://localhost:3000"}/bookings`, "View Bookings")
  ),
});

/** Booking status change (generic) */
const bookingStatusUpdate = ({ recipientName, status, subject, sessionDate, sessionTime }) => ({
  subject: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)} — ${subject}`,
  html: layout(
    `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    p(`Hi ${recipientName},`) +
      p(`Your booking for <strong>${subject}</strong> on <strong>${sessionDate}</strong> at <strong>${sessionTime}</strong> has been updated to <strong>${status}</strong>.`) +
      btn(`${process.env.CLIENT_URL || "http://localhost:3000"}/bookings`, "View Details")
  ),
});

/** Payment confirmation */
const paymentConfirmation = ({ studentName, amount, subject, paymentId }) => ({
  subject: `Payment Received — ₹${amount}`,
  html: layout(
    "Payment Successful 💳",
    p(`Hi ${studentName},`) +
      p(`We've received your payment of <strong>₹${amount}</strong> for <strong>${subject}</strong>.`) +
      p(`Payment ID: <code>${paymentId}</code>`) +
      btn(`${process.env.CLIENT_URL || "http://localhost:3000"}/bookings`, "View Bookings")
  ),
});

/** Review notification to teacher */
const newReviewNotification = ({ teacherName, studentName, rating, comment }) => ({
  subject: `New Review — ${rating}★ from ${studentName}`,
  html: layout(
    "New Review ⭐",
    p(`Hi ${teacherName},`) +
      p(`${studentName} left you a <strong>${rating}-star</strong> review:`) +
      (comment ? `<blockquote style="border-left:4px solid ${PRIMARY_COLOR};margin:16px 0;padding:8px 16px;color:#374151;">${comment}</blockquote>` : "") +
      btn(`${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard`, "View Dashboard")
  ),
});

module.exports = {
  welcome,
  bookingConfirmation,
  newBookingTeacher,
  bookingStatusUpdate,
  paymentConfirmation,
  newReviewNotification,
};
