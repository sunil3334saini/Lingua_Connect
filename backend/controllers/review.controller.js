const Review = require("../models/Review");
const Teacher = require("../models/Teacher");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { sendMail } = require("../services/email.service");
const emailTemplates = require("../services/email.templates");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

// @desc    Create a review
// @route   POST /api/reviews
exports.createReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment } = req.body;

  // Check booking exists and belongs to student
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (booking.studentId.toString() !== req.user._id.toString()) {
    throw new AppError("Not authorized to review this booking", 403);
  }

  if (booking.status !== "completed") {
    throw new AppError("Can only review completed sessions", 400);
  }

  // Check if already reviewed
  const existingReview = await Review.findOne({
    bookingId,
    studentId: req.user._id,
  });
  if (existingReview) {
    throw new AppError("Already reviewed this session", 400);
  }

  const review = await Review.create({
    studentId: req.user._id,
    teacherId: booking.teacherId,
    teacherProfileId: booking.teacherProfileId,
    bookingId,
    rating,
    comment,
  });

  // Update teacher average rating
  const allReviews = await Review.find({ teacherProfileId: booking.teacherProfileId });
  const avgRating =
    allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  await Teacher.findByIdAndUpdate(booking.teacherProfileId, {
    rating: Math.round(avgRating * 10) / 10,
    totalReviews: allReviews.length,
  });

  res.status(201).json({ success: true, review });

  // Notify teacher about the new review (fire-and-forget)
  const teacherUser = await User.findById(booking.teacherId).lean();
  if (teacherUser) {
    sendMail({
      to: teacherUser.email,
      ...emailTemplates.newReviewNotification({
        teacherName: teacherUser.name,
        studentName: req.user.name,
        rating,
        comment,
      }),
    }).catch(() => {});
  }
});

// @desc    Get reviews for a teacher
// @route   GET /api/reviews/:teacherId
exports.getTeacherReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ teacherProfileId: req.params.teacherId })
    .populate("studentId", "name profileImage")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Review.countDocuments({ teacherProfileId: req.params.teacherId });

  res.json({
    success: true,
    reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
