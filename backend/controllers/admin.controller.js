const User = require("../models/User");
const Teacher = require("../models/Teacher");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

// ─── Users ─────────────────────────────────────────────────────

// @desc    Get all users (with filters)
// @route   GET /api/admin/users?role=student&page=1&limit=20&search=john
exports.getUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(filter).select("-password").skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    users,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
  });
});

// @desc    Get single user
// @route   GET /api/admin/users/:id
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) throw new AppError("User not found", 404);
  res.json({ success: true, user });
});

// @desc    Update user (admin can change role, status, etc.)
// @route   PUT /api/admin/users/:id
exports.updateUser = asyncHandler(async (req, res) => {
  const { name, phone, role } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (role !== undefined) updates.role = role;

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) throw new AppError("User not found", 404);
  res.json({ success: true, user });
});

// @desc    Delete user (and related teacher profile)
// @route   DELETE /api/admin/users/:id
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError("User not found", 404);

  // Cascade: remove teacher profile if exists
  await Teacher.findOneAndDelete({ userId: user._id });
  await user.deleteOne();

  res.json({ success: true, message: "User deleted" });
});

// ─── Teachers ──────────────────────────────────────────────────

// @desc    Get all teacher profiles (admin view with user data)
// @route   GET /api/admin/teachers?page=1&limit=20&search=math
exports.getTeachers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (search) {
    filter.subjects = { $regex: search, $options: "i" };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [teachers, total] = await Promise.all([
    Teacher.find(filter)
      .populate("userId", "name email phone role")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Teacher.countDocuments(filter),
  ]);

  res.json({
    success: true,
    teachers,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
  });
});

// @desc    Delete teacher profile
// @route   DELETE /api/admin/teachers/:id
exports.deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findByIdAndDelete(req.params.id);
  if (!teacher) throw new AppError("Teacher profile not found", 404);
  res.json({ success: true, message: "Teacher profile deleted" });
});

// ─── Bookings ──────────────────────────────────────────────────

// @desc    Get all bookings (admin)
// @route   GET /api/admin/bookings?status=upcoming&page=1&limit=20
exports.getBookings = asyncHandler(async (req, res) => {
  const { status, paymentStatus, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("studentId", "name email")
      .populate("teacherId", "name email")
      .populate("teacherProfileId", "subjects price")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Booking.countDocuments(filter),
  ]);

  res.json({
    success: true,
    bookings,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
  });
});

// @desc    Update any booking (admin override)
// @route   PUT /api/admin/bookings/:id
exports.updateBooking = asyncHandler(async (req, res) => {
  const { status, paymentStatus } = req.body;
  const updates = {};
  if (status) updates.status = status;
  if (paymentStatus) updates.paymentStatus = paymentStatus;

  const booking = await Booking.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!booking) throw new AppError("Booking not found", 404);
  res.json({ success: true, booking });
});

// @desc    Delete a booking
// @route   DELETE /api/admin/bookings/:id
exports.deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByIdAndDelete(req.params.id);
  if (!booking) throw new AppError("Booking not found", 404);

  // Also remove associated reviews
  await Review.deleteMany({ bookingId: booking._id });

  res.json({ success: true, message: "Booking and associated reviews deleted" });
});

// ─── Dashboard stats ───────────────────────────────────────────

// @desc    Admin dashboard statistics
// @route   GET /api/admin/stats
exports.getStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalTeachers, totalBookings, totalRevenue, recentBookings] =
    await Promise.all([
      User.countDocuments(),
      Teacher.countDocuments(),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Booking.find()
        .populate("studentId", "name email")
        .populate("teacherId", "name email")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

  // Role breakdown
  const [students, teachers] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "teacher" }),
  ]);

  // Booking status breakdown
  const bookingsByStatus = await Booking.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalTeachers,
      totalBookings,
      totalRevenue: recentBookings.length ? (totalRevenue[0]?.total || 0) : 0,
      userBreakdown: { students, teachers },
      bookingsByStatus: bookingsByStatus.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {}),
      recentBookings,
    },
  });
});

// ─── Payments overview ─────────────────────────────────────────

// @desc    Get all payments (admin)
// @route   GET /api/admin/payments?paymentStatus=paid&page=1&limit=20
exports.getPayments = asyncHandler(async (req, res) => {
  const { paymentStatus, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  // Only return bookings that have a razorpayOrderId (i.e. payment was initiated)
  filter.razorpayOrderId = { $ne: "" };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [payments, total] = await Promise.all([
    Booking.find(filter)
      .select("studentId teacherId amount paymentStatus razorpayOrderId razorpayPaymentId createdAt")
      .populate("studentId", "name email")
      .populate("teacherId", "name email")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Booking.countDocuments(filter),
  ]);

  res.json({
    success: true,
    payments,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
  });
});
