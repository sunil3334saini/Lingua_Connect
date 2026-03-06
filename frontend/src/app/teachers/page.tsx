"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { TeacherProfile } from "@/types";
import { Star, Clock, Search, SlidersHorizontal } from "lucide-react";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTeachers();
  }, [page, sortBy]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: "12",
      };
      if (search) params.subject = search;
      if (sortBy) params.sortBy = sortBy;

      const res = await api.get("/search", { params });
      setTeachers(res.data.teachers);
      setTotalPages(res.data.pagination.pages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTeachers();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Find Teachers</h1>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-8">
        <form
          onSubmit={handleSearch}
          className="flex flex-col md:flex-row gap-3"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by subject (e.g. English, Mathematics, Physics)"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 bg-white"
              >
                <option value="">Sort: Best Rated</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="experience">Most Experienced</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Teachers Grid */}
      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 shadow-sm border animate-pulse"
            >
              <div className="h-12 w-12 bg-gray-200 rounded-full mb-4" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : teachers.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">
            No teachers found. Try a different search.
          </p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((teacher) => (
              <Link
                key={teacher._id}
                href={`/teacher/${teacher._id}`}
                className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition block"
              >
                {/* Teacher Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                    {teacher.userId?.name?.charAt(0)?.toUpperCase() || "T"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {teacher.userId?.name || "Teacher"}
                    </h3>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-gray-700 font-medium">
                        {teacher.rating.toFixed(1)}
                      </span>
                      <span className="text-gray-400">
                        ({teacher.totalReviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subjects */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {teacher.subjects.slice(0, 3).map((sub, i) => (
                    <span
                      key={i}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                    >
                      {sub}
                    </span>
                  ))}
                  {teacher.subjects.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{teacher.subjects.length - 3} more
                    </span>
                  )}
                </div>

                {/* Experience & Price */}
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    {teacher.experience} yrs exp
                  </span>
                  <span className="font-semibold text-gray-900">
                    ₹{teacher.price}/hr
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
