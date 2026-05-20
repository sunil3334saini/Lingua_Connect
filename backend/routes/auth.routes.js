const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getUserById,
  refreshAccessToken,
  logoutUser,
} = require("../controllers/auth.controller");
const { uploadUserProfileImage, deleteUserProfileImage } = require("../controllers/upload.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate");
const { createUpload } = require("../middleware/upload");
const { registerRules, loginRules, updateProfileRules, forgotPasswordRules, resetPasswordRules } = require("../validators/auth.validator");

const uploadProfileImage = createUpload({ folder: "lingua-connect/profiles" });

router.post("/register", validate(registerRules), register);
router.post("/login", validate(loginRules), login);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", verifyToken, resendVerification);
router.post("/forgot-password", validate(forgotPasswordRules), forgotPassword);
router.post("/reset-password", validate(resetPasswordRules), resetPassword);
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, validate(updateProfileRules), updateProfile);
router.put("/profile-image", verifyToken, uploadProfileImage, uploadUserProfileImage);
router.delete("/profile-image", verifyToken, deleteUserProfileImage);
router.get("/user/:id", verifyToken, getUserById);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);

module.exports = router;
