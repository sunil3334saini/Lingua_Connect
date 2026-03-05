const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const { Server } = require("socket.io");
const initSocket = require("./socket/socket");
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
app.use(helmet());                        // Security headers (XSS, clickjack, MIME sniff, etc.)
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
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

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Lingua Connect API is running" });
});

// ── Catch-all for undefined routes ─────────────────────────────
app.all("*", (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// ── Centralized error handler (must be LAST middleware) ────────
app.use(errorHandler);

// Initialize Socket.io
initSocket(io);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info("MongoDB connected");
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    });
  })
  .catch((err) => {
    logger.error("MongoDB connection error:", err);
    process.exit(1);
  });
