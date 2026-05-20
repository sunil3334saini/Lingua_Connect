const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const { Server } = require("socket.io");
const initSocket = require("./socket/socket");
const { initReminderCron, initAutoCompleteCron } = require("./services/reminder.service");
const { verifyTransporter } = require("./services/email.service");
const { authLimiter, apiLimiter, uploadLimiter, paymentLimiter } = require("./middleware/rateLimiter");
const logger = require("./config/logger");
const errorHandler = require("./middleware/errorHandler");
const AppError = require("./utils/AppError");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// ── Security middleware ────────────────────────────────────────
const clientOrigin = process.env.CLIENT_URL || "http://localhost:3000";
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
        connectSrc: ["'self'", clientOrigin],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // allow Socket.io cross-origin handshake
  })
);
app.use(cors({ origin: clientOrigin, credentials: true }));

// Razorpay webhook needs raw body for HMAC verification — mount BEFORE express.json()
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  require("./routes/webhook.routes")
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP request logging (Morgan → Winston) ───────────────────
app.use(
  morgan("short", {
    stream: logger.stream,
    skip: (_req, res) => res.statusCode < 400, // log only errors in production
  })
);
if (process.env.NODE_ENV !== "production") {
  // In development, log ALL requests
  app.use(morgan("dev"));
}

// ── Rate limiting ──────────────────────────────────────────────
app.use("/api/auth", authLimiter);        // Strict: 15 req / 15 min
app.use("/api/payments", paymentLimiter); // 20 req / 15 min
app.use("/api", apiLimiter);              // General: 100 req / 15 min (applied last — more specific wins)

// Make io accessible in routes
app.set("io", io);

// ── Routes ─────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/teacher", require("./routes/teacher.routes"));
app.use("/api/search", require("./routes/search.routes"));
app.use("/api/bookings", require("./routes/booking.routes"));
app.use("/api/payments", require("./routes/payment.routes"));
app.use("/api/reviews", require("./routes/review.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/sessions", require("./routes/session.routes"));
app.use("/api/messages", require("./routes/message.routes"));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Lingua Connect API is running" });
});

// ── Catch-all for undefined routes ─────────────────────────────
app.all("/{*splat}", (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// ── Centralized error handler (must be LAST middleware) ────────
app.use(errorHandler);

// Initialize Socket.io
initSocket(io);

// Start class reminder cron job
initReminderCron(io);
// Auto-complete sessions that have passed their end time
initAutoCompleteCron();
// Verify SMTP on startup
verifyTransporter();

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info("MongoDB connected");
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        logger.error(`Port ${PORT} is already in use. Please free the port or use a different one.`);
      } else {
        logger.error("Server error:", err);
      }
      process.exit(1);
    });
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    });
  })
  .catch((err) => {
    logger.error("MongoDB connection error:", err);
    process.exit(1);
  });
