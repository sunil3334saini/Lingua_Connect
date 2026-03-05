const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    subjects: {
      type: [String],
      required: [true, "At least one subject is required"],
    },
    experience: {
      type: Number,
      required: [true, "Experience is required"],
      min: 0,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    price: {
      type: Number,
      required: [true, "Price per session is required"],
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    availability: {
      type: [
        {
          day: {
            type: String,
            enum: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ],
          },
          startTime: String, // e.g. "09:00"
          endTime: String, // e.g. "17:00"
        },
      ],
      default: [],
    },
    profileImage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Index for search
teacherSchema.index({ subjects: 1 });
teacherSchema.index({ rating: -1 });
teacherSchema.index({ price: 1 });

module.exports = mongoose.model("Teacher", teacherSchema);
