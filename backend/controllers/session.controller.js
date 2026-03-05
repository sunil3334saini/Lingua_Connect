const SessionHistory = require("../models/SessionHistory");
const sessionService = require("../services/session.service");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

// ─── CRUD ──────────────────────────────────────────────────────

// @desc    Get all sessions for the logged-in student
// @route   GET /api/sessions/student
exports.getStudentSessions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { studentId: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [sessions, total] = await Promise.all([
    SessionHistory.find(filter)
      .populate("teacherId", "name email")
      .populate("teacherProfileId", "subjects")
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(limit),
    SessionHistory.countDocuments(filter),
  ]);

  res.json({
    success: true,
    sessions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Get all sessions for the logged-in teacher
// @route   GET /api/sessions/teacher
exports.getTeacherSessions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { teacherId: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [sessions, total] = await Promise.all([
    SessionHistory.find(filter)
      .populate("studentId", "name email")
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(limit),
    SessionHistory.countDocuments(filter),
  ]);

  res.json({
    success: true,
    sessions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Get a single session by ID
// @route   GET /api/sessions/:id
exports.getSessionById = asyncHandler(async (req, res) => {
  const session = await SessionHistory.findById(req.params.id)
    .populate("studentId", "name email profileImage")
    .populate("teacherId", "name email profileImage")
    .populate("teacherProfileId", "subjects price")
    .populate("bookingId");

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  // Only participants (or admin) may view
  const userId = req.user._id.toString();
  if (
    session.studentId._id.toString() !== userId &&
    session.teacherId._id.toString() !== userId &&
    req.user.role !== "admin"
  ) {
    throw new AppError("Not authorized", 403);
  }

  res.json({ success: true, session });
});

// @desc    Get session by booking ID
// @route   GET /api/sessions/booking/:bookingId
exports.getSessionByBookingId = asyncHandler(async (req, res) => {
  const session = await SessionHistory.findOne({ bookingId: req.params.bookingId })
    .populate("studentId", "name email profileImage")
    .populate("teacherId", "name email profileImage")
    .populate("teacherProfileId", "subjects price");

  if (!session) {
    throw new AppError("Session history not found for this booking", 404);
  }

  const userId = req.user._id.toString();
  if (
    session.studentId._id.toString() !== userId &&
    session.teacherId._id.toString() !== userId &&
    req.user.role !== "admin"
  ) {
    throw new AppError("Not authorized", 403);
  }

  res.json({ success: true, session });
});

// ─── Session lifecycle (called from socket or API) ─────────────

// @desc    Mark participant joined
// @route   PUT /api/sessions/:id/join
exports.joinSession = asyncHandler(async (req, res) => {
  const session = await sessionService.markJoined(req.params.id, req.user.role);
  if (!session) {
    throw new AppError("Session not found", 404);
  }
  res.json({ success: true, session });
});

// @desc    Mark session ended
// @route   PUT /api/sessions/:id/end
exports.endSession = asyncHandler(async (req, res) => {
  const session = await sessionService.markEnded(req.params.id);
  res.json({ success: true, session });
});

// @desc    Add teacher notes to a session
// @route   PUT /api/sessions/:id/notes
exports.addNotes = asyncHandler(async (req, res) => {
  const { teacherNotes } = req.body;

  const session = await SessionHistory.findById(req.params.id);
  if (!session) {
    throw new AppError("Session not found", 404);
  }

  // Only the teacher of this session can add notes
  if (session.teacherId.toString() !== req.user._id.toString()) {
    throw new AppError("Only the session teacher can add notes", 403);
  }

  session.teacherNotes = teacherNotes;
  await session.save();

  res.json({ success: true, session });
});

// @desc    Upload a session recording
// @route   PUT /api/sessions/:id/recording
exports.uploadRecording = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("No recording file provided", 400);
  }

  const session = await SessionHistory.findById(req.params.id);
  if (!session) {
    throw new AppError("Session not found", 404);
  }

  // Only participants can upload
  const userId = req.user._id.toString();
  if (
    session.studentId.toString() !== userId &&
    session.teacherId.toString() !== userId
  ) {
    throw new AppError("Not authorized", 403);
  }

  const recording = {
    url: req.file.path,                            // Cloudinary URL
    publicId: req.file.filename || "",              // Cloudinary public_id
    fileSize: req.file.size || 0,
    format: req.file.mimetype?.split("/")[1] || "webm",
    duration: parseInt(req.body.duration, 10) || 0, // client sends duration in seconds
    uploadedBy: req.user._id,
  };

  const updated = await sessionService.addRecording(session._id, recording);

  res.json({
    success: true,
    message: "Recording uploaded",
    session: updated,
  });
});

// @desc    Delete a recording from a session
// @route   DELETE /api/sessions/:id/recording/:recordingId
exports.deleteRecording = asyncHandler(async (req, res) => {
  const session = await SessionHistory.findById(req.params.id);
  if (!session) {
    throw new AppError("Session not found", 404);
  }

  // Only the uploader or admin can delete
  const recording = session.recordings.id(req.params.recordingId);
  if (!recording) {
    throw new AppError("Recording not found", 404);
  }

  const userId = req.user._id.toString();
  if (recording.uploadedBy?.toString() !== userId && req.user.role !== "admin") {
    throw new AppError("Not authorized to delete this recording", 403);
  }

  // Remove from Cloudinary if public ID exists
  if (recording.publicId) {
    const cloudinary = require("../config/cloudinary");
    await cloudinary.uploader.destroy(recording.publicId, { resource_type: "video" }).catch(() => {});
  }

  recording.deleteOne();
  await session.save();

  res.json({ success: true, message: "Recording deleted" });
});
