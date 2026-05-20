const Booking = require("../models/Booking");
const Review = require("../models/Review");
const Teacher = require("../models/Teacher");
const SessionHistory = require("../models/SessionHistory");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

// @desc    Get analytics data for the logged-in teacher
// @route   GET /api/teacher/analytics
exports.getTeacherAnalytics = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;

  const teacherProfile = await Teacher.findOne({ userId: teacherId });
  if (!teacherProfile) {
    throw new AppError("Teacher profile not found", 404);
  }

  const profileId = teacherProfile._id;

  // ── Aggregate bookings ──────────────────────────────────────
  const allBookings = await Booking.find({ teacherId }).lean();
  const paidBookings = allBookings.filter((b) => b.paymentStatus === "paid");

  const totalRevenue = paidBookings.reduce((sum, b) => sum + b.amount, 0);
  const totalBookings = allBookings.length;
  const upcomingBookings = allBookings.filter((b) => b.status === "upcoming").length;
  const completedBookings = allBookings.filter((b) => b.status === "completed").length;
  const cancelledBookings = allBookings.filter((b) => b.status === "cancelled").length;

  // Unique students
  const uniqueStudentIds = new Set(allBookings.map((b) => b.studentId.toString()));
  const totalStudents = uniqueStudentIds.size;

  // ── Revenue by month (last 12 months) ───────────────────────
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const revenueByMonth = await Booking.aggregate([
    {
      $match: {
        teacherId: teacherId,
        paymentStatus: "paid",
        createdAt: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        revenue: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Fill in missing months
  const monthlyRevenue = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const entry = revenueByMonth.find(
      (r) => r._id.year === year && r._id.month === month
    );
    monthlyRevenue.push({
      month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      revenue: entry?.revenue || 0,
      sessions: entry?.count || 0,
    });
  }

  // ── Subject breakdown ───────────────────────────────────────
  const subjectBreakdown = await Booking.aggregate([
    { $match: { teacherId: teacherId } },
    {
      $group: {
        _id: "$subject",
        count: { $sum: 1 },
        revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$amount", 0] } },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // ── Rating distribution ─────────────────────────────────────
  const reviews = await Review.find({ teacherId }).lean();
  const ratingDistribution = [0, 0, 0, 0, 0]; // index 0 = 1 star
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) ratingDistribution[r.rating - 1]++;
  });

  // ── Recent reviews ──────────────────────────────────────────
  const recentReviews = await Review.find({ teacherId })
    .populate("studentId", "name profileImage")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // ── Session completion rate ─────────────────────────────────
  const sessions = await SessionHistory.find({ teacherId }).lean();
  const completedSessions = sessions.filter((s) => s.status === "completed").length;
  const missedSessions = sessions.filter((s) => s.status === "missed").length;
  const completionRate =
    sessions.length > 0
      ? Math.round((completedSessions / sessions.length) * 100)
      : 100;

  // ── Upcoming sessions (next 7 days) ─────────────────────────
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const upcomingSessions = await Booking.find({
    teacherId,
    status: "upcoming",
    sessionDate: { $gte: new Date(), $lte: weekFromNow },
  })
    .populate("studentId", "name email profileImage")
    .sort({ sessionDate: 1, sessionTime: 1 })
    .limit(10)
    .lean();

  res.json({
    success: true,
    analytics: {
      overview: {
        totalRevenue,
        totalBookings,
        totalStudents,
        upcomingBookings,
        completedBookings,
        cancelledBookings,
        averageRating: teacherProfile.rating,
        totalReviews: teacherProfile.totalReviews,
        completionRate,
      },
      monthlyRevenue,
      subjectBreakdown,
      ratingDistribution,
      recentReviews,
      upcomingSessions,
    },
  });
});
