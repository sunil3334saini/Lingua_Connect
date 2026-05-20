"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import api from "@/lib/api";
import { ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
interface DaySlots {
  day: string;
  date: string;
  slots: string[];
}

interface AvailabilityCalendarProps {
  /** Teacher profile _id */
  teacherProfileId: string;
  /** Slot duration in minutes (default: 60) */
  slotMinutes?: number;
  /** Days to fetch ahead (default: 7) */
  daysAhead?: number;
  /** Callback when a slot is selected */
  onSelectSlot?: (date: string, time: string) => void;
  /** Externally-selected date (controlled) */
  selectedDate?: string;
  /** Externally-selected time (controlled) */
  selectedTime?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAME = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Format "2026-03-10" → "Mar 10" */
function shortDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${MONTH_NAME[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

/** Format "09:00" → "9:00 AM" */
function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

/** ISO date string for today */
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */
export default function AvailabilityCalendar({
  teacherProfileId,
  slotMinutes = 60,
  daysAhead = 7,
  onSelectSlot,
  selectedDate: controlledDate,
  selectedTime: controlledTime,
}: AvailabilityCalendarProps) {
  const [weekStart, setWeekStart] = useState<string>(todayISO());
  const [data, setData] = useState<DaySlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // internal selection (uncontrolled fallback)
  const [internalDate, setInternalDate] = useState<string>("");
  const [internalTime, setInternalTime] = useState<string>("");

  const activeDate = controlledDate ?? internalDate;
  const activeTime = controlledTime ?? internalTime;

  /* ── Fetch a week of availability ─────────────────────────── */
  const fetchRange = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(
        `/teacher/${teacherProfileId}/availability/range`,
        { params: { from: weekStart, days: daysAhead, slotMinutes } }
      );
      setData(res.data.availability);
    } catch {
      setError("Unable to load availability.");
    } finally {
      setLoading(false);
    }
  }, [teacherProfileId, weekStart, daysAhead, slotMinutes]);

  useEffect(() => {
    fetchRange();
  }, [fetchRange]);

  /* ── Navigation ───────────────────────────────────────────── */
  const canGoBack = weekStart > todayISO();

  const goBack = () => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() - daysAhead);
    const min = todayISO();
    const iso = d.toISOString().slice(0, 10);
    setWeekStart(iso < min ? min : iso);
  };

  const goForward = () => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + daysAhead);
    setWeekStart(d.toISOString().slice(0, 10));
  };

  /* ── Which day is currently shown in the slot list ─────────── */
  const activeDayData = useMemo(
    () => data.find((d) => d.date === activeDate) ?? null,
    [data, activeDate]
  );

  /* ── Select handler ────────────────────────────────────────── */
  const handleSelectSlot = (date: string, time: string) => {
    setInternalDate(date);
    setInternalTime(time);
    onSelectSlot?.(date, time);
  };

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* ── Header row with arrows ─────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>

        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {data.length > 0
            ? `${shortDate(data[0].date)} — ${shortDate(data[data.length - 1].date)}`
            : "Availability"}
        </h3>

        <button
          onClick={goForward}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          aria-label="Next week"
        >
          <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* ── Loading / Error ────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-red-500 py-6">{error}</p>
      )}

      {/* ── Day pills (horizontal scroll on mobile) ────────── */}
      {!loading && !error && (
        <>
          <div className="flex overflow-x-auto gap-1 px-3 py-3 scrollbar-hide">
            {data.map((d) => {
              const dateObj = new Date(d.date + "T00:00:00");
              const isSelected = d.date === activeDate;
              const hasSlots = d.slots.length > 0;

              return (
                <button
                  key={d.date}
                  onClick={() => {
                    setInternalDate(d.date);
                    setInternalTime("");
                  }}
                  disabled={!hasSlots}
                  className={`flex flex-col items-center min-w-[4rem] px-3 py-2 rounded-xl text-xs font-medium transition shrink-0 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-sm"
                      : hasSlots
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                  }`}
                >
                  <span className="uppercase tracking-wide">
                    {WEEKDAY_SHORT[dateObj.getDay()]}
                  </span>
                  <span className={`text-lg font-bold ${isSelected ? "text-white" : ""}`}>
                    {dateObj.getDate()}
                  </span>
                  {hasSlots && (
                    <span
                      className={`mt-0.5 text-[10px] ${
                        isSelected ? "text-blue-100" : "text-green-600"
                      }`}
                    >
                      {d.slots.length} slot{d.slots.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Time slots grid ──────────────────────────────── */}
          {activeDayData && (
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {activeDayData.day}, {shortDate(activeDayData.date)} —{" "}
                {activeDayData.slots.length} available
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {activeDayData.slots.map((slot) => {
                  const isActive =
                    activeDate === activeDayData.date && activeTime === slot;

                  return (
                    <button
                      key={slot}
                      onClick={() => handleSelectSlot(activeDayData.date, slot)}
                      className={`px-3 py-2 text-sm rounded-lg font-medium transition ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400"
                      }`}
                    >
                      {formatTime(slot)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* No day selected yet */}
          {!activeDayData && (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-6">
              Select a day above to see available time slots.
            </p>
          )}
        </>
      )}
    </div>
  );
}
