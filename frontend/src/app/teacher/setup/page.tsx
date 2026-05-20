"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { X, CalendarOff } from "lucide-react";

interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function TeacherSetupPage() {
  const { user, isAuthenticated, loadFromStorage } = useAuthStore();
  const router = useRouter();

  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState("");
  const [experience, setExperience] = useState(0);
  const [bio, setBio] = useState("");
  const [price, setPrice] = useState(0);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [dateInput, setDateInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.role !== "teacher") {
      router.push("/dashboard");
      return;
    }
    fetchProfile();
  }, [isAuthenticated, user]);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/teacher/profile/me");
      const t = res.data.teacher;
      setSubjects(t.subjects || []);
      setExperience(t.experience || 0);
      setBio(t.bio || "");
      setPrice(t.price || 0);
      setAvailability(t.availability || []);
      setBlockedDates(t.blockedDates || []);
      setIsEdit(true);
    } catch {
      // Profile doesn't exist yet — that's fine
    } finally {
      setFetching(false);
    }
  };

  const addSubject = () => {
    const trimmed = subjectInput.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects([...subjects, trimmed]);
      setSubjectInput("");
    }
  };

  const removeSubject = (s: string) => {
    setSubjects(subjects.filter((sub) => sub !== s));
  };

  const addAvailability = () => {
    setAvailability([
      ...availability,
      { day: "Monday", startTime: "09:00", endTime: "17:00" },
    ]);
  };

  const updateAvailability = (
    index: number,
    field: keyof AvailabilitySlot,
    value: string
  ) => {
    const updated = [...availability];
    updated[index] = { ...updated[index], [field]: value };
    setAvailability(updated);
  };

  const removeAvailability = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const addBlockedDate = () => {
    if (dateInput && !blockedDates.includes(dateInput)) {
      setBlockedDates([...blockedDates, dateInput].sort());
      setDateInput("");
    }
  };

  const removeBlockedDate = (d: string) => {
    setBlockedDates(blockedDates.filter((x) => x !== d));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (subjects.length === 0) {
      toast.error("Add at least one subject");
      return;
    }
    setLoading(true);

    try {
      const data = { subjects, experience, bio, price, availability, blockedDates };
      if (isEdit) {
        await api.put("/teacher/profile", data);
        toast.success("Profile updated!");
      } else {
        await api.post("/teacher/profile", data);
        toast.success("Profile created!");
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {isEdit ? "Edit" : "Setup"} Teaching Profile
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
        Configure your subjects, pricing, and availability
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subjects */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subjects You Teach
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubject())}
              placeholder="e.g. English, Mathematics"
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none text-gray-900 dark:text-white dark:bg-gray-700"
            />
            <button
              type="button"
              onClick={addSubject}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {subjects.map((sub) => (
              <span
                key={sub}
                className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
              >
                {sub}
                <button
                  type="button"
                  onClick={() => removeSubject(sub)}
                  className="text-blue-400 hover:text-blue-700 ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Years of Experience
          </label>
          <input
            type="number"
            value={experience}
            onChange={(e) => setExperience(parseInt(e.target.value) || 0)}
            min={0}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none text-gray-900 dark:text-white dark:bg-gray-700"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Price per Hour (₹)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
            min={0}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none text-gray-900 dark:text-white dark:bg-gray-700"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Tell students about yourself, your teaching style, qualifications..."
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none text-gray-900 dark:text-white dark:bg-gray-700 resize-none"
          />
        </div>

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Availability
          </label>
          {availability.map((slot, i) => (
            <div key={i} className="flex gap-2 mb-2 items-center">
              <select
                value={slot.day}
                onChange={(e) => updateAvailability(i, "day", e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none text-gray-900 dark:text-white dark:bg-gray-700"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) =>
                  updateAvailability(i, "startTime", e.target.value)
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none text-gray-900 dark:text-white dark:bg-gray-700"
              />
              <span className="text-gray-400">to</span>
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) =>
                  updateAvailability(i, "endTime", e.target.value)
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none text-gray-900 dark:text-white dark:bg-gray-700"
              />
              <button
                type="button"
                onClick={() => removeAvailability(i)}
                className="text-red-400 hover:text-red-600 text-lg"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addAvailability}
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            + Add time slot
          </button>
        </div>

        {/* Blocked Dates */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <CalendarOff className="h-4 w-4 text-orange-500" />
            Blocked Dates / Vacation
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Add dates when you are unavailable (holidays, vacation, etc.)
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none text-gray-900 dark:text-white dark:bg-gray-700"
            />
            <button
              type="button"
              onClick={addBlockedDate}
              disabled={!dateInput}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-40 transition"
            >
              Block
            </button>
          </div>
          {blockedDates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {blockedDates.map((d) => (
                <span
                  key={d}
                  className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-sm"
                >
                  {d}
                  <button
                    type="button"
                    onClick={() => removeBlockedDate(d)}
                    className="text-orange-400 hover:text-orange-700 dark:hover:text-orange-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading
            ? "Saving..."
            : isEdit
            ? "Update Profile"
            : "Create Profile"}
        </button>
      </form>
    </div>
  );
}
