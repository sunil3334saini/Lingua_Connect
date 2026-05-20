const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendMail } = require("../services/email.service");
const emailTemplates = require("../services/email.templates");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "15m",
  });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE || "30d",
  });

// @desc    Register user
// @route   POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("User already exists with this email", 400);
  }

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationExpires,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
  });

  // Send verification email (fire-and-forget)
  const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`;
  sendMail({
    to: user.email,
    ...emailTemplates.emailVerification({ name: user.name, verifyUrl }),
  }).catch(() => {});
});

// @desc    Login user
// @route   POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check user exists
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Invalid credentials", 400);
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError("Invalid credentials", 400);
  }

  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Persist hashed refresh token so it can be invalidated on logout
  user.refreshToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    token,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
  });
});

// @desc    Issue a new access token using a valid refresh token
// @route   POST /api/auth/refresh
exports.refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError("Refresh token required", 400);

  let decoded;
  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET
    );
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const hashed = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const user = await User.findOne({ _id: decoded.id, refreshToken: hashed });
  if (!user) throw new AppError("Refresh token has been revoked", 401);

  res.json({ success: true, token: generateToken(user._id) });
});

// @desc    Logout — revoke refresh token
// @route   POST /api/auth/logout
exports.logoutUser = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const hashed = crypto.createHash("sha256").update(refreshToken).digest("hex");
    await User.findOneAndUpdate({ refreshToken: hashed }, { refreshToken: null });
  }
  res.json({ success: true });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.json({ success: true, user });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, profileImage } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, profileImage },
    { new: true, runValidators: true }
  ).select("-password");

  res.json({ success: true, user });
});

// @desc    Verify email address via token
// @route   GET /api/auth/verify-email?token=...
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) {
    throw new AppError("Verification token is required", 400);
  }

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError("Invalid or expired verification token", 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  // Send welcome email now that email is verified
  sendMail({
    to: user.email,
    ...emailTemplates.welcome({ name: user.name }),
  }).catch(() => {});

  res.json({ success: true, message: "Email verified successfully" });
});

// @desc    Forgot password – send reset link
// @route   POST /api/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) {
    return res.json({ success: true, message: "If that email exists, a reset link has been sent" });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
  await sendMail({
    to: user.email,
    ...emailTemplates.passwordReset({ name: user.name, resetUrl }),
  });

  res.json({ success: true, message: "If that email exists, a reset link has been sent" });
});

// @desc    Reset password via token
// @route   POST /api/auth/reset-password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new AppError("Token and new password are required", 400);
  }

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  res.json({ success: true, message: "Password has been reset successfully" });
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @desc    Get public info for any user (for chat partner display)
// @route   GET /api/auth/user/:id
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("name profileImage role").lean();
  if (!user) throw new AppError("User not found", 404);
  res.json({ success: true, user });
});

exports.resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);

  if (user.isEmailVerified) {
    throw new AppError("Email is already verified", 400);
  }

  // Generate new token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpires = verificationExpires;
  await user.save();

  const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`;
  await sendMail({
    to: user.email,
    ...emailTemplates.emailVerification({ name: user.name, verifyUrl }),
  });

  res.json({ success: true, message: "Verification email sent" });
});
