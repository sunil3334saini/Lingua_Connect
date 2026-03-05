const User = require("../models/User");
const Teacher = require("../models/Teacher");
const { deleteImage } = require("../middleware/upload");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

/**
 * @desc    Upload / replace profile image for current user
 * @route   PUT /api/auth/profile-image
 * @access  Private
 */
exports.uploadUserProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("No image file provided", 400);
  }

  const user = await User.findById(req.user._id);

  // Remove previous image from Cloudinary if it exists
  if (user.profileImage) {
    await deleteImage(user.profileImage);
  }

  user.profileImage = req.file.path; // Cloudinary URL
  await user.save();

  res.json({
    success: true,
    message: "Profile image updated",
    profileImage: user.profileImage,
  });
});

/**
 * @desc    Upload / replace profile image for teacher profile
 * @route   PUT /api/teacher/profile-image
 * @access  Private (teacher)
 */
exports.uploadTeacherProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("No image file provided", 400);
  }

  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }

  // Remove previous image from Cloudinary if it exists
  if (teacher.profileImage) {
    await deleteImage(teacher.profileImage);
  }

  teacher.profileImage = req.file.path; // Cloudinary URL
  await teacher.save();

  res.json({
    success: true,
    message: "Teacher profile image updated",
    profileImage: teacher.profileImage,
  });
});

/**
 * @desc    Delete profile image for current user
 * @route   DELETE /api/auth/profile-image
 * @access  Private
 */
exports.deleteUserProfileImage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.profileImage) {
    await deleteImage(user.profileImage);
    user.profileImage = "";
    await user.save();
  }

  res.json({ success: true, message: "Profile image removed" });
});
