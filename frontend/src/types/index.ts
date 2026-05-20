// API & App Types

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "student" | "teacher" | "admin";
  profileImage?: string;
  isEmailVerified?: boolean;
  createdAt?: string;
}

export interface TeacherProfile {
  _id: string;
  userId: User;
  subjects: string[];
  experience: number;
  bio: string;
  price: number;
  rating: number;
  totalReviews: number;
  availability: Availability[];
  blockedDates?: string[];
  profileImage?: string;
  createdAt?: string;
}

export interface Availability {
  day: string;
  startTime: string;
  endTime: string;
}

export interface Booking {
  _id: string;
  studentId: User;
  teacherId: User;
  teacherProfileId: TeacherProfile;
  subject: string;
  sessionDate: string;
  sessionTime: string;
  duration: number;
  amount: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  meetingRoomId: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  createdAt?: string;
}

export interface Review {
  _id: string;
  studentId: User;
  teacherId: string;
  teacherProfileId: string;
  bookingId: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ChatMessage {
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

// ── Session history ────────────────────────────────────────────

export interface Recording {
  _id: string;
  url: string;
  publicId: string;
  duration: number; // seconds
  fileSize: number; // bytes
  format: string;
  uploadedBy: string | User;
  uploadedAt: string;
}

export interface SessionHistory {
  _id: string;
  bookingId: string | Booking;
  studentId: string | User;
  teacherId: string | User;
  teacherProfileId: string | TeacherProfile;
  subject: string;
  scheduledDate: string;
  scheduledTime: string;
  scheduledDuration: number;
  actualStartTime?: string;
  actualEndTime?: string;
  actualDuration: number;
  studentJoined: boolean;
  teacherJoined: boolean;
  status: "completed" | "missed" | "partial" | "cancelled";
  teacherNotes: string;
  recordings: Recording[];
  meetingRoomId: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Notifications ──────────────────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// ── Admin ──────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalTeachers: number;
  totalBookings: number;
  totalRevenue: number;
  userBreakdown: { students: number; teachers: number };
  bookingsByStatus: Record<string, number>;
  recentBookings: Booking[];
}

// ── Teacher Analytics ──────────────────────────────────────────

export interface TeacherAnalytics {
  overview: {
    totalRevenue: number;
    totalBookings: number;
    totalStudents: number;
    upcomingBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    averageRating: number;
    totalReviews: number;
    completionRate: number;
  };
  monthlyRevenue: { month: string; revenue: number; sessions: number }[];
  subjectBreakdown: { _id: string; count: number; revenue: number }[];
  ratingDistribution: number[];
  recentReviews: {
    _id: string;
    rating: number;
    comment: string;
    createdAt: string;
    studentId: { name: string; profileImage?: string };
  }[];
  upcomingSessions: Booking[];
}
