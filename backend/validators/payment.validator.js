const { body, param } = require("express-validator");

/** POST /api/payments/create-order */
const createOrderRules = [
  body("bookingId")
    .notEmpty()
    .withMessage("Booking ID is required")
    .isMongoId()
    .withMessage("Invalid booking ID"),
];

/** POST /api/payments/verify */
const verifyPaymentRules = [
  body("razorpay_order_id")
    .notEmpty()
    .withMessage("Razorpay order ID is required"),
  body("razorpay_payment_id")
    .notEmpty()
    .withMessage("Razorpay payment ID is required"),
  body("razorpay_signature")
    .notEmpty()
    .withMessage("Razorpay signature is required"),
  body("bookingId")
    .notEmpty()
    .withMessage("Booking ID is required")
    .isMongoId()
    .withMessage("Invalid booking ID"),
];

/** GET /api/payments/:bookingId */
const getPaymentStatusRules = [
  param("bookingId").isMongoId().withMessage("Invalid booking ID"),
];

module.exports = {
  createOrderRules,
  verifyPaymentRules,
  getPaymentStatusRules,
};
