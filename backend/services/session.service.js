const SessionHistory = require("../models/SessionHistory");
const Booking = require("../models/Booking");

/**
 * Create a SessionHistory record from a completed/cancelled booking.
 * Idempotent — will not create duplicates for the same bookingId.
 *
 * @param {string} bookingId
 * @param {Object} [extras] – Optional overrides (actualStartTime, etc.)
 * @returns {Promise<import("mongoose").Document>}
 */
const createFromBooking = async (bookingId, extras = {}) => {
  // Guard against duplicates
  const existing = await SessionHistory.findOne({ bookingId });
  if (existing) return existing;

  const booking = await Booking.findById(bookingId).lean();
  if (!booking) throw new Error("Booking not found");

  const history = await SessionHistory.create({
    bookingId: booking._id,
    studentId: booking.studentId,
    teacherId: booking.teacherId,
    teacherProfileId: booking.teacherProfileId,
    subject: booking.subject,
    scheduledDate: booking.sessionDate,
    scheduledTime: booking.sessionTime,
    scheduledDuration: booking.duration,
    meetingRoomId: booking.meetingRoomId || "",
    status: booking.status === "cancelled" ? "cancelled" : "completed",
    ...extras,
  });

  return history;
};

/**
 * Mark session as started (teacher or student joined the call).
 *
 * @param {string} sessionId – SessionHistory _id
 * @param {"student"|"teacher"} role
 * @returns {Promise<import("mongoose").Document>}
 */
const markJoined = async (sessionId, role) => {
  const update = {};
  if (role === "student") update.studentJoined = true;
  if (role === "teacher") update.teacherJoined = true;

  // Set actualStartTime only if this is the first join
  const session = await SessionHistory.findById(sessionId).lean();
  if (session && !session.actualStartTime) {
    update.actualStartTime = new Date();
  }

  return SessionHistory.findByIdAndUpdate(sessionId, update, { new: true });
};

/**
 * Mark session as ended and compute actual duration.
 *
 * @param {string} sessionId
 * @returns {Promise<import("mongoose").Document>}
 */
const markEnded = async (sessionId) => {
  const session = await SessionHistory.findById(sessionId);
  if (!session) throw new Error("Session not found");

  session.actualEndTime = new Date();

  if (session.actualStartTime) {
    session.actualDuration = Math.round(
      (session.actualEndTime - session.actualStartTime) / 60000
    );
  }

  // Determine final status
  if (!session.studentJoined || !session.teacherJoined) {
    session.status = session.studentJoined || session.teacherJoined ? "partial" : "missed";
  } else {
    session.status = "completed";
  }

  await session.save();
  return session;
};

/**
 * Add a recording URL to an existing session.
 *
 * @param {string} sessionId
 * @param {Object} recording – { url, publicId, duration, fileSize, format, uploadedBy }
 * @returns {Promise<import("mongoose").Document>}
 */
const addRecording = async (sessionId, recording) => {
  return SessionHistory.findByIdAndUpdate(
    sessionId,
    { $push: { recordings: recording } },
    { new: true }
  );
};

module.exports = {
  createFromBooking,
  markJoined,
  markEnded,
  addRecording,
};
