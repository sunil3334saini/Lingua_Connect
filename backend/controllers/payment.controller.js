const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { sendMail } = require("../services/email.service");
const emailTemplates = require("../services/email.templates");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
exports.createOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (booking.paymentStatus === "paid") {
    throw new AppError("Payment already completed", 400);
  }

  const options = {
    amount: booking.amount * 100, // Razorpay expects amount in paise
    currency: "INR",
    receipt: `receipt_${bookingId}`,
    notes: {
      bookingId: bookingId,
      studentId: booking.studentId.toString(),
      teacherId: booking.teacherId.toString(),
    },
  };

  const order = await razorpay.orders.create(options);

  // Save order ID to booking
  booking.razorpayOrderId = order.id;
  await booking.save();

  res.json({
    success: true,
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    },
    key: process.env.RAZORPAY_KEY_ID,
  });
});

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

  // Verify signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new AppError("Payment verification failed", 400);
  }

  // Update booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  booking.paymentStatus = "paid";
  booking.razorpayPaymentId = razorpay_payment_id;
  await booking.save();

  res.json({
    success: true,
    message: "Payment verified successfully",
    booking,
  });

  // Send payment confirmation email (fire-and-forget)
  const student = await User.findById(booking.studentId).lean();
  if (student) {
    sendMail({
      to: student.email,
      ...emailTemplates.paymentConfirmation({
        studentName: student.name,
        amount: booking.amount,
        subject: booking.subject || "Session",
        paymentId: razorpay_payment_id,
      }),
    }).catch(() => {});
  }
});

// @desc    Get payment status
// @route   GET /api/payments/:bookingId
exports.getPaymentStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId).select(
    "paymentStatus razorpayOrderId razorpayPaymentId amount"
  );

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  res.json({ success: true, payment: booking });
});
