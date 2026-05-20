const cron = require("node-cron");
const Booking = require("../models/Booking");
const SessionHistory = require("../models/SessionHistory");
const User = require("../models/User");
const { sendMail } = require("./email.service");
const emailTemplates = require("./email.templates");
const logger = require("../config/logger");

/**
 * Initialise the class-reminder cron.
 * Runs every 5 minutes, finds bookings starting in the next 30 minutes
 * that haven't been reminded yet, and sends email + socket notification.
 *
 * @param {import("socket.io").Server} io - Socket.io server instance
 */
function initReminderCron(io) {
  // Track bookings we've already reminded so we don't spam
  const reminded = new Set();

  // Run every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();
      const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);

      // Find upcoming paid bookings within the next 30 minutes
      const bookings = await Booking.find({
        status: "upcoming",
        paymentStatus: "paid",
        sessionDate: {
          $gte: now,
          $lte: thirtyMinutesLater,
        },
      })
        .populate("studentId", "name email")
        .populate("teacherId", "name email")
        .lean();

      for (const booking of bookings) {
        // Build a comparable datetime from sessionDate + sessionTime
        const dateStr = new Date(booking.sessionDate).toISOString().split("T")[0];
        const sessionDateTime = new Date(`${dateStr}T${booking.sessionTime}:00`);

        // Only remind if session is between now and 30 min from now
        if (sessionDateTime <= now || sessionDateTime > thirtyMinutesLater) continue;

        const bookingKey = booking._id.toString();
        if (reminded.has(bookingKey)) continue;
        reminded.add(bookingKey);

        const fmtDate = new Date(booking.sessionDate).toLocaleDateString();
        const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
        const joinUrl = `${clientUrl}/call/${booking.meetingRoomId}`;

        // Reminder for student
        if (booking.studentId?.email) {
          sendMail({
            to: booking.studentId.email,
            ...emailTemplates.classReminder({
              name: booking.studentId.name,
              subject: booking.subject,
              teacherName: booking.teacherId?.name || "Your teacher",
              studentName: booking.studentId.name,
              sessionDate: fmtDate,
              sessionTime: booking.sessionTime,
              role: "student",
              joinUrl,
            }),
          }).catch((err) => logger.error("Reminder email error (student):", err));
        }

        // Reminder for teacher
        if (booking.teacherId?.email) {
          sendMail({
            to: booking.teacherId.email,
            ...emailTemplates.classReminder({
              name: booking.teacherId.name,
              subject: booking.subject,
              teacherName: booking.teacherId.name,
              studentName: booking.studentId?.name || "A student",
              sessionDate: fmtDate,
              sessionTime: booking.sessionTime,
              role: "teacher",
              joinUrl,
            }),
          }).catch((err) => logger.error("Reminder email error (teacher):", err));
        }

        // Socket notification to both parties
        const notification = {
          type: "class_reminder",
          message: `Reminder: Your "${booking.subject}" session starts at ${booking.sessionTime}`,
          bookingId: booking._id,
          meetingRoomId: booking.meetingRoomId,
          sessionTime: booking.sessionTime,
          timestamp: new Date().toISOString(),
        };

        if (booking.studentId?._id) {
          io.emit(`notification_${booking.studentId._id}`, notification);
        }
        if (booking.teacherId?._id) {
          io.emit(`notification_${booking.teacherId._id}`, notification);
        }

        logger.info(
          `Reminder sent for booking ${bookingKey}: ${booking.subject} at ${booking.sessionTime}`
        );
      }

      // Cleanup old entries from the reminded set (older than 2 hours)
      // We do a simple periodic purge to prevent memory leak
      if (reminded.size > 500) {
        reminded.clear();
      }
    } catch (err) {
      logger.error("Reminder cron error:", err);
    }
  });

  logger.info("Class reminder cron initialised (every 5 minutes)");
}

/**
 * Auto-complete sessions whose end time has passed.
 * Runs every 10 minutes. Marks upcoming→completed and creates SessionHistory.
 */
function initAutoCompleteCron() {
  cron.schedule("*/10 * * * *", async () => {
    try {
      const now = new Date();

      const overdue = await Booking.find({
        status: "upcoming",
        paymentStatus: "paid",
      }).lean();

      for (const booking of overdue) {
        const dateStr = new Date(booking.sessionDate).toISOString().split("T")[0];
        const sessionStart = new Date(`${dateStr}T${booking.sessionTime}:00`);
        const sessionEnd = new Date(sessionStart.getTime() + (booking.duration || 60) * 60 * 1000);

        if (sessionEnd > now) continue; // not over yet

        await Booking.findByIdAndUpdate(booking._id, { status: "completed" });

        // Create SessionHistory if not already present
        const exists = await SessionHistory.exists({ bookingId: booking._id });
        if (!exists) {
          await SessionHistory.create({
            bookingId: booking._id,
            studentId: booking.studentId,
            teacherId: booking.teacherId,
            teacherProfileId: booking.teacherProfileId,
            subject: booking.subject,
            scheduledDate: booking.sessionDate,
            scheduledTime: booking.sessionTime,
            scheduledDuration: booking.duration || 60,
            actualDuration: booking.duration || 60,
            status: "completed",
            meetingRoomId: booking.meetingRoomId,
          });
        }

        logger.info(`Auto-completed booking ${booking._id} (${booking.subject})`);
      }
    } catch (err) {
      logger.error("Auto-complete cron error:", err);
    }
  });

  logger.info("Auto-complete sessions cron initialised (every 10 minutes)");
}

module.exports = { initReminderCron, initAutoCompleteCron };
