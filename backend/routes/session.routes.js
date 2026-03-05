const express = require("express");
const router = express.Router();
const session = require("../controllers/session.controller");
const { verifyToken, isStudent, isTeacher } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate");
const { createUpload } = require("../middleware/upload");
const v = require("../validators/session.validator");

// Recording upload middleware (video/audio files, max 200 MB)
const uploadRecording = createUpload({
  folder: "lingua-connect/recordings",
  allowedFormats: ["webm", "mp4", "ogg", "mp3", "wav"],
  maxFileSize: 200 * 1024 * 1024, // 200 MB
  fieldName: "recording",
  transformation: "", // no transformation for recordings
});

// ── Read routes ────────────────────────────────────────────────
router.get("/student", verifyToken, isStudent, validate(v.paginationRules), session.getStudentSessions);
router.get("/teacher", verifyToken, isTeacher, validate(v.paginationRules), session.getTeacherSessions);
router.get("/booking/:bookingId", verifyToken, validate(v.getSessionByBookingIdRules), session.getSessionByBookingId);
router.get("/:id", verifyToken, validate(v.getSessionByIdRules), session.getSessionById);

// ── Session lifecycle ──────────────────────────────────────────
router.put("/:id/join", verifyToken, validate(v.joinSessionRules), session.joinSession);
router.put("/:id/end", verifyToken, validate(v.endSessionRules), session.endSession);

// ── Teacher notes ──────────────────────────────────────────────
router.put("/:id/notes", verifyToken, isTeacher, validate(v.addNotesRules), session.addNotes);

// ── Recordings ─────────────────────────────────────────────────
router.put("/:id/recording", verifyToken, validate(v.uploadRecordingRules), uploadRecording, session.uploadRecording);
router.delete("/:id/recording/:recordingId", verifyToken, validate(v.deleteRecordingRules), session.deleteRecording);

module.exports = router;
