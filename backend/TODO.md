# Lingua Connect — Backend TODO

## ✅ Completed
- [x] Project initialization (Express, MongoDB, dependencies)
- [x] Folder structure (controllers, models, routes, middleware, socket)
- [x] MongoDB Models: User, Teacher, Booking, Review
- [x] Authentication (Register, Login, JWT, Middleware)
- [x] Teacher Profile CRUD APIs
- [x] Search/Filter Teachers API
- [x] Booking System APIs
- [x] Razorpay Payment Integration (Create Order, Verify Payment)
- [x] Review/Rating System APIs
- [x] Socket.io Setup (Chat + WebRTC Signaling)

## 🔧 In Progress / TODO
- [x] Add input validation (express-validator)
- [x] File upload for profile images (multer / cloudinary)
- [x] Email notifications (nodemailer)
- [x] Admin routes (manage users, teachers, payments)
- [x] Teacher availability calendar logic
- [x] Session history & recordings storage
- [x] Rate limiting & security headers (helmet, express-rate-limit)
- [ ] API documentation (Swagger / Postman collection)
- [ ] Unit & integration tests (Jest / Supertest)
- [ ] Production deployment (AWS EC2 / Render / Railway)
- [ ] MongoDB Atlas setup for production
- [ ] TURN server setup for WebRTC production
- [x] Logging (Winston / Morgan)
- [x] Error handling middleware (centralized)
- [ ] Pagination improvements
- [ ] Webhook endpoint for Razorpay server-to-server verification

## 📁 Backend Structure
```
backend/
├── config/
│   ├── db.js
│   ├── cloudinary.js
│   └── logger.js
├── controllers/
│   ├── auth.controller.js
│   ├── teacher.controller.js
│   ├── search.controller.js
│   ├── booking.controller.js
│   ├── payment.controller.js
│   ├── review.controller.js
│   └── upload.controller.js
├── middleware/
│   ├── auth.middleware.js
│   ├── validate.js
│   ├── upload.js
│   ├── rateLimiter.js
│   └── errorHandler.js
├── validators/
│   ├── auth.validator.js
│   ├── teacher.validator.js
│   ├── booking.validator.js
│   ├── review.validator.js
│   ├── payment.validator.js
│   └── search.validator.js
├── models/
│   ├── User.js
│   ├── Teacher.js
│   ├── Booking.js
│   └── Review.js
├── routes/
│   ├── auth.routes.js
│   ├── teacher.routes.js
│   ├── search.routes.js
│   ├── booking.routes.js
│   ├── payment.routes.js
│   └── review.routes.js
├── utils/
│   ├── AppError.js
│   └── asyncHandler.js
├── socket/
│   └── socket.js
├── logs/              (auto-generated, gitignored)
├── .env
├── .gitignore
├── package.json
└── server.js
```

## 🔌 API Endpoints Summary
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/profile | Get profile (auth) |
| PUT | /api/auth/profile | Update profile (auth) |
| PUT | /api/auth/profile-image | Upload profile image (auth) |
| DELETE | /api/auth/profile-image | Delete profile image (auth) |
| POST | /api/teacher/profile | Create teacher profile |
| GET | /api/teacher/profile/me | Get own teacher profile |
| GET | /api/teacher/all | Get all teachers |
| GET | /api/teacher/:id | Get teacher by ID |
| PUT | /api/teacher/profile | Update teacher profile |
| PUT | /api/teacher/profile-image | Upload teacher profile image |
| GET | /api/search?subject=... | Search teachers |
| POST | /api/bookings | Create booking |
| GET | /api/bookings/student | Student bookings |
| GET | /api/bookings/teacher | Teacher bookings |
| GET | /api/bookings/:id | Get booking by ID |
| PUT | /api/bookings/:id/status | Update booking status |
| POST | /api/payments/create-order | Create Razorpay order |
| POST | /api/payments/verify | Verify payment |
| GET | /api/payments/:bookingId | Payment status |
| POST | /api/reviews | Create review |
| GET | /api/reviews/:teacherId | Get teacher reviews |

## 🔌 Socket.io Events
| Event | Direction | Description |
|-------|-----------|-------------|
| user_online | Client→Server | User comes online |
| online_users | Server→Client | List of online users |
| join_room | Client→Server | Join chat room |
| send_message | Client→Server | Send chat message |
| receive_message | Server→Client | Receive chat message |
| typing / stop_typing | Client→Server | Typing indicators |
| join_call | Client→Server | Join video call |
| webrtc_offer | Bidirectional | WebRTC SDP offer |
| webrtc_answer | Bidirectional | WebRTC SDP answer |
| webrtc_ice_candidate | Bidirectional | ICE candidate |
| end_call | Client→Server | End video call |
| toggle_media | Client→Server | Mute/unmute audio/video |
