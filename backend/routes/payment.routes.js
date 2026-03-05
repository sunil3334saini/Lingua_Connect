const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment, getPaymentStatus } = require("../controllers/payment.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate");
const { createOrderRules, verifyPaymentRules, getPaymentStatusRules } = require("../validators/payment.validator");

router.post("/create-order", verifyToken, validate(createOrderRules), createOrder);
router.post("/verify", verifyToken, validate(verifyPaymentRules), verifyPayment);
router.get("/:bookingId", verifyToken, validate(getPaymentStatusRules), getPaymentStatus);

module.exports = router;
