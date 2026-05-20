const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
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
    subject: {
      type: String,
      required: true,
    },
    sessionDate: {
      type: Date,
      required: true,
    },
    sessionTime: {
      type: String,
      required: true, // e.g. "14:00"
    },
    duration: {
      type: Number,
      default: 60, // minutes
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    razorpayOrderId: {
      type: String,
      default: "",
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    razorpayRefundId: {
      type: String,
      default: "",
    },
    meetingRoomId: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
  },
  { timestamps: true }
);

// Indexes for common query patterns
bookingSchema.index({ studentId: 1, sessionDate: -1 });
bookingSchema.index({ teacherId: 1, sessionDate: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ razorpayOrderId: 1 }, { sparse: true });
bookingSchema.index({ sessionDate: 1, status: 1 }); // reminder cron queries

module.exports = mongoose.model("Booking", bookingSchema);
