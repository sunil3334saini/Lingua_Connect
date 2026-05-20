"use client";

import { useCallback, useRef, useState } from "react";
import api from "@/lib/api";
import { Recording } from "@/types";
import toast from "react-hot-toast";
import {
  Upload,
  Trash2,
  Play,
  Pause,
  Download,
  Film,
  FileAudio,
  Clock,
  HardDrive,
  X,
  AlertTriangle,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────── */

interface SessionRecordingUIProps {
  /** The session ObjectId */
  sessionId: string;
  /** Pre-loaded recordings (avoids initial fetch) */
  recordings: Recording[];
  /** Current user id – used to decide if delete is allowed */
  currentUserId: string;
  /** Whether the user can upload recordings */
  canUpload?: boolean;
  /** Called when the recording list changes so the parent can re-fetch / update */
  onRecordingsChange?: (recordings: Recording[]) => void;
}

const ALLOWED_FORMATS = ["video/webm", "video/mp4", "video/ogg", "audio/mp3", "audio/mpeg", "audio/wav", "audio/ogg"];
const MAX_SIZE = 200 * 1024 * 1024; // 200 MB

/* ────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────── */

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function isVideo(format: string): boolean {
  return ["webm", "mp4", "ogg"].includes(format);
}

/* ────────────────────────────────────────────────────────────────
   Individual Recording Card
   ──────────────────────────────────────────────────────────────── */

function RecordingCard({
  recording,
  currentUserId,
  onDelete,
}: {
  recording: Recording;
  currentUserId: string;
  onDelete: (id: string) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  const uploaderId =
    typeof recording.uploadedBy === "string"
      ? recording.uploadedBy
      : recording.uploadedBy?.id;

  const canDelete = uploaderId === currentUserId;

  const togglePlay = () => {
    if (!mediaRef.current) return;
    if (playing) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleEnded = () => setPlaying(false);

  const video = isVideo(recording.format);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
      {/* Player area */}
      <div className="relative bg-gray-900">
        {video ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement | null>}
            src={recording.url}
            onEnded={handleEnded}
            className="w-full aspect-video object-contain"
            preload="metadata"
            playsInline
          />
        ) : (
          <div className="flex items-center justify-center py-8">
            <FileAudio className="h-10 w-10 text-gray-400" />
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement | null>}
              src={recording.url}
              onEnded={handleEnded}
              preload="metadata"
            />
          </div>
        )}

        {/* Play overlay button */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition group"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className="h-10 w-10 text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition" />
          ) : (
            <Play className="h-10 w-10 text-white drop-shadow-lg" />
          )}
        </button>
      </div>

      {/* Metadata row */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            {video ? <Film className="h-3.5 w-3.5" /> : <FileAudio className="h-3.5 w-3.5" />}
            {recording.format.toUpperCase()}
          </span>
          {recording.duration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(recording.duration)}
            </span>
          )}
          {recording.fileSize > 0 && (
            <span className="flex items-center gap-1">
              <HardDrive className="h-3.5 w-3.5" />
              {formatBytes(recording.fileSize)}
            </span>
          )}
          <span>
            {new Date(recording.uploadedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <a
            href={recording.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>

          {canDelete && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="ml-auto flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}

          {canDelete && confirmDelete && (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => onDelete(recording._id)}
                className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Upload Area
   ──────────────────────────────────────────────────────────────── */

function UploadArea({
  sessionId,
  onUploaded,
}: {
  sessionId: string;
  onUploaded: (recordings: Recording[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validate = (file: File): string | null => {
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return `Unsupported format (${file.type}). Use webm, mp4, ogg, mp3, or wav.`;
    }
    if (file.size > MAX_SIZE) {
      return `File too large (${formatBytes(file.size)}). Max is ${formatBytes(MAX_SIZE)}.`;
    }
    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    const err = validate(file);
    if (err) {
      toast.error(err);
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const upload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("recording", selectedFile);

    try {
      // Get the duration client-side before uploading
      const duration = await getMediaDuration(selectedFile);
      formData.append("duration", String(Math.round(duration)));

      const res = await api.put(
        `/sessions/${sessionId}/recording`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress(e) {
            if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
          },
        }
      );

      toast.success("Recording uploaded!");
      setSelectedFile(null);
      setProgress(0);
      onUploaded(res.data.session.recordings);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition ${
          dragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:bg-gray-700/50"
        }`}
      >
        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium text-blue-600">Click to browse</span>{" "}
          or drag &amp; drop
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          webm, mp4, ogg, mp3, wav &bull; Max 200 MB
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="video/webm,video/mp4,video/ogg,audio/mpeg,audio/wav,audio/ogg"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Selected file preview */}
      {selectedFile && (
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg px-4 py-3">
          {selectedFile.type.startsWith("video") ? (
            <Film className="h-5 w-5 text-blue-500 shrink-0" />
          ) : (
            <FileAudio className="h-5 w-5 text-purple-500 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-400">{formatBytes(selectedFile.size)}</p>
          </div>
          {!uploading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Progress bar */}
      {uploading && (
        <div className="space-y-1">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-right">{progress}%</p>
        </div>
      )}

      {/* Upload button */}
      {selectedFile && (
        <button
          onClick={upload}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition text-sm"
        >
          <Upload className="h-4 w-4" />
          {uploading ? `Uploading… ${progress}%` : "Upload Recording"}
        </button>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Helper: extract media duration from a File
   ──────────────────────────────────────────────────────────────── */

function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = file.type.startsWith("video")
      ? document.createElement("video")
      : document.createElement("audio");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(isFinite(el.duration) ? el.duration : 0);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    el.src = url;
  });
}

/* ────────────────────────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────────────────────────── */

export default function SessionRecordingUI({
  sessionId,
  recordings: initialRecordings,
  currentUserId,
  canUpload = false,
  onRecordingsChange,
}: SessionRecordingUIProps) {
  const [recordings, setRecordings] = useState<Recording[]>(initialRecordings);
  const [deleting, setDeleting] = useState<string | null>(null);

  const updateRecordings = (updated: Recording[]) => {
    setRecordings(updated);
    onRecordingsChange?.(updated);
  };

  const handleDelete = async (recordingId: string) => {
    setDeleting(recordingId);
    try {
      await api.delete(`/sessions/${sessionId}/recording/${recordingId}`);
      const updated = recordings.filter((r) => r._id !== recordingId);
      updateRecordings(updated);
      toast.success("Recording deleted");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Film className="h-5 w-5 text-blue-500" />
          Session Recordings
          {recordings.length > 0 && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
              {recordings.length}
            </span>
          )}
        </h3>
      </div>

      {/* Recordings grid */}
      {recordings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recordings.map((rec) => (
            <div key={rec._id} className={deleting === rec._id ? "opacity-50 pointer-events-none" : ""}>
              <RecordingCard
                recording={rec}
                currentUserId={currentUserId}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
          <Film className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No recordings yet</p>
        </div>
      )}

      {/* Upload section */}
      {canUpload && (
        <UploadArea sessionId={sessionId} onUploaded={updateRecordings} />
      )}
    </div>
  );
}
