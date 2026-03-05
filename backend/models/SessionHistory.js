const mongoose = require("mongoose");

/**
 * SessionHistory tracks what happened during a completed booking session:
 *   – Timing (actual start / end vs scheduled)
 *   – Participants & attendance
 *   – Notes from teacher
 *   – Recording metadata (Cloudinary URLs)
 *   – Quality / feedback flags
 *
 * One SessionHistory per Booking (1-to-1 relation).
 */
const sessionHistorySchema = new mongoose.Schema(
  {
    // ── References ──────────────────────────────────────────────
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true, // one history per booking
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacherProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    // ── Session details ────────────────────────────────────────
    subject: {
      type: String,
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    scheduledTime: {
      type: String, // "HH:mm"
      required: true,
    },
    scheduledDuration: {
      type: Number, // minutes
      required: true,
    },

    // ── Actual timing ──────────────────────────────────────────
    actualStartTime: {
      type: Date,
      default: null,
    },
    actualEndTime: {
      type: Date,
      default: null,
    },
    actualDuration: {
      type: Number, // computed minutes
      default: 0,
    },

    // ── Attendance ─────────────────────────────────────────────
    studentJoined: {
      type: Boolean,
      default: false,
    },
    teacherJoined: {
      type: Boolean,
      default: false,
    },

    // ── Session status ─────────────────────────────────────────
    status: {
      type: String,
      enum: ["completed", "missed", "partial", "cancelled"],
      default: "completed",
    },

    // ── Teacher notes ──────────────────────────────────────────
    teacherNotes: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    // ── Recordings (Cloudinary URLs) ───────────────────────────
    recordings: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String, default: "" },         // Cloudinary public_id
          duration: { type: Number, default: 0 },           // seconds
          fileSize: { type: Number, default: 0 },           // bytes
          format: { type: String, default: "webm" },
          uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    // ── Metadata ───────────────────────────────────────────────
    meetingRoomId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────
sessionHistorySchema.index({ studentId: 1, scheduledDate: -1 });
sessionHistorySchema.index({ teacherId: 1, scheduledDate: -1 });
sessionHistorySchema.index({ bookingId: 1 }, { unique: true });

module.exports = mongoose.model("SessionHistory", sessionHistorySchema);
