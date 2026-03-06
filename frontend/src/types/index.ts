// API & App Types

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "student" | "teacher";
  profileImage?: string;
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
