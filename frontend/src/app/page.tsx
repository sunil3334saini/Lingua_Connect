import Link from "next/link";
import { BookOpen, Video, MessageSquare, Star, Users, Search } from "lucide-react";

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-linear-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Learn Any Subject from Expert Teachers
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-8">
              Connect with verified teachers for personalized 1:1 or group
              sessions through live video calls, audio calls, and chat.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link
                href="/register"
                className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition"
              >
                Get Started
              </Link>
              <Link
                href="/teachers"
                className="border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition"
              >
                Browse Teachers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Lingua Connect?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Video className="h-10 w-10 text-blue-600" />,
                title: "Live Video & Audio Calls",
                desc: "Learn face-to-face with teachers through high-quality video and audio sessions.",
              },
              {
                icon: <MessageSquare className="h-10 w-10 text-blue-600" />,
                title: "Real-time Chat",
                desc: "Chat with your teacher before, during, and after sessions for seamless communication.",
              },
              {
                icon: <Search className="h-10 w-10 text-blue-600" />,
                title: "Search & Filter",
                desc: "Find the perfect teacher by subject, rating, price, and experience level.",
              },
              {
                icon: <Star className="h-10 w-10 text-blue-600" />,
                title: "Ratings & Reviews",
                desc: "Read authentic reviews from other students to make informed choices.",
              },
              {
                icon: <Users className="h-10 w-10 text-blue-600" />,
                title: "1:1 & Group Sessions",
                desc: "Book private sessions or join group classes based on your preference.",
              },
              {
                icon: <BookOpen className="h-10 w-10 text-blue-600" />,
                title: "Any Subject",
                desc: "From languages to mathematics, find expert teachers across all subjects.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition"
              >
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-gray-600 mb-8">
            Join thousands of students and teachers on Lingua Connect.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/register?role=student"
              className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Join as Student
            </Link>
            <Link
              href="/register?role=teacher"
              className="bg-gray-900 text-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-800 transition"
            >
              Join as Teacher
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-6 w-6 text-blue-400" />
            <span className="text-lg font-bold text-white">
              Lingua<span className="text-blue-400">Connect</span>
            </span>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Lingua Connect. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
