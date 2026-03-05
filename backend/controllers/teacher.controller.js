const Teacher = require("../models/Teacher");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

// @desc    Create teacher profile
// @route   POST /api/teacher/profile
exports.createProfile = asyncHandler(async (req, res) => {
  // Check if profile already exists
  const existing = await Teacher.findOne({ userId: req.user._id });
  if (existing) {
    throw new AppError("Teacher profile already exists", 400);
  }

  const { subjects, experience, bio, price, availability, profileImage } = req.body;

  const teacher = await Teacher.create({
    userId: req.user._id,
    subjects,
    experience,
    bio,
    price,
    availability,
    profileImage,
  });

  res.status(201).json({ success: true, teacher });
});

// @desc    Get teacher profile by user ID
// @route   GET /api/teacher/profile/me
exports.getMyProfile = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id }).populate(
    "userId",
    "name email phone profileImage"
  );
  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }
  res.json({ success: true, teacher });
});

// @desc    Get teacher profile by teacher ID
// @route   GET /api/teacher/:id
exports.getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id).populate(
    "userId",
    "name email phone profileImage"
  );
  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }
  res.json({ success: true, teacher });
});

// @desc    Get all teachers
// @route   GET /api/teacher/all
exports.getAllTeachers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const teachers = await Teacher.find()
    .populate("userId", "name email phone profileImage")
    .skip(skip)
    .limit(limit)
    .sort({ rating: -1 });

  const total = await Teacher.countDocuments();

  res.json({
    success: true,
    teachers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Update teacher profile
// @route   PUT /api/teacher/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { subjects, experience, bio, price, availability, profileImage } = req.body;

  const teacher = await Teacher.findOneAndUpdate(
    { userId: req.user._id },
    { subjects, experience, bio, price, availability, profileImage },
    { new: true, runValidators: true }
  );

  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }

  res.json({ success: true, teacher });
});
