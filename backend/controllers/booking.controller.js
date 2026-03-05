const Booking = require("../models/Booking");
const Teacher = require("../models/Teacher");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");
const { sendMail } = require("../services/email.service");
const emailTemplates = require("../services/email.templates");
const { isSlotAvailable } = require("../services/availability.service");
const sessionService = require("../services/session.service");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

// @desc    Create a booking
// @route   POST /api/bookings
exports.createBooking = asyncHandler(async (req, res) => {
  const { teacherProfileId, subject, sessionDate, sessionTime, duration } = req.body;

  const teacher = await Teacher.findById(teacherProfileId);
  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }

  // Check availability before creating booking
  const dur = duration || 60;
  const slotFree = await isSlotAvailable(teacherProfileId, sessionDate, sessionTime, dur);
  if (!slotFree) {
    throw new AppError(
      "The requested time slot is not available. Please choose another slot.",
      409
    );
  }

  const amount = teacher.price * (dur / 60);
  const meetingRoomId = uuidv4();

  const booking = await Booking.create({
    studentId: req.user._id,
    teacherId: teacher.userId,
    teacherProfileId: teacher._id,
    subject,
    sessionDate,
    sessionTime,
    duration: dur,
    amount,
    meetingRoomId,
  });

  res.status(201).json({ success: true, booking });

  // Send email notifications (fire-and-forget)
  const teacherUser = await User.findById(teacher.userId).lean();
  const dateStr = new Date(sessionDate).toLocaleDateString();

  sendMail({
    to: req.user.email,
    ...emailTemplates.bookingConfirmation({
      studentName: req.user.name,
      teacherName: teacherUser?.name || "Teacher",
      subject,
      sessionDate: dateStr,
      sessionTime,
      duration: dur,
      amount,
    }),
  }).catch(() => {});

  if (teacherUser) {
    sendMail({
      to: teacherUser.email,
      ...emailTemplates.newBookingTeacher({
        teacherName: teacherUser.name,
        studentName: req.user.name,
        subject,
        sessionDate: dateStr,
        sessionTime,
      }),
    }).catch(() => {});
  }
});

// @desc    Get student's bookings
// @route   GET /api/bookings/student
exports.getStudentBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ studentId: req.user._id })
    .populate("teacherId", "name email")
    .populate("teacherProfileId", "subjects price")
    .sort({ sessionDate: -1 });

  res.json({ success: true, bookings });
});

// @desc    Get teacher's bookings
// @route   GET /api/bookings/teacher
exports.getTeacherBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ teacherId: req.user._id })
    .populate("studentId", "name email")
    .sort({ sessionDate: -1 });

  res.json({ success: true, bookings });
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
exports.updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  res.json({ success: true, booking });

  // Auto-create session history when booking is completed or cancelled
  if (status === "completed" || status === "cancelled") {
    sessionService.createFromBooking(booking._id).catch(() => {});
  }

  // Notify both parties about the status change (fire-and-forget)
  const [student, teacher] = await Promise.all([
    User.findById(booking.studentId).lean(),
    User.findById(booking.teacherId).lean(),
  ]);
  const dateStr = new Date(booking.sessionDate).toLocaleDateString();

  [student, teacher].filter(Boolean).forEach((user) => {
    sendMail({
      to: user.email,
      ...emailTemplates.bookingStatusUpdate({
        recipientName: user.name,
        status,
        subject: booking.subject,
        sessionDate: dateStr,
        sessionTime: booking.sessionTime,
      }),
    }).catch(() => {});
  });
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
exports.getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("studentId", "name email")
    .populate("teacherId", "name email")
    .populate("teacherProfileId", "subjects price");

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  // Ensure user is part of this booking
  if (
    booking.studentId._id.toString() !== req.user._id.toString() &&
    booking.teacherId._id.toString() !== req.user._id.toString()
  ) {
    throw new AppError("Not authorized", 403);
  }

  res.json({ success: true, booking });
});
