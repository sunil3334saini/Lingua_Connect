const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth.middleware");
const {
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
} = require("../controllers/message.controller");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validate");

router.use(verifyToken);

router.get("/conversations", getConversations);
router.get("/unread-count", getUnreadCount);
router.get("/:userId", validate([param("userId").isMongoId()]), getMessages);
router.post(
  "/",
  validate([
    body("receiverId").isMongoId(),
    body("message").trim().notEmpty().isLength({ max: 2000 }),
  ]),
  sendMessage
);

module.exports = router;
