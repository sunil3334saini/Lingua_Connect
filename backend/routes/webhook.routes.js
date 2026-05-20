const express = require("express");
const router = express.Router();
const { razorpayWebhook } = require("../controllers/payment.controller");

// POST /api/payments/webhook
// Raw body is already applied in server.js before this router
router.post("/", razorpayWebhook);

module.exports = router;
