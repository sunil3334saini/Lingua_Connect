"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Trash2, Loader2, Upload } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface ProfileImageUploadProps {
  /** Current image URL (Cloudinary) */
  currentImage?: string | null;
  /** Fallback text shown when no image (e.g. user initials) */
  fallbackText?: string;
  /** API endpoint for uploading (default: /auth/profile-image) */
  uploadUrl?: string;
  /** API endpoint for deleting (default: /auth/profile-image) */
  deleteUrl?: string;
  /** Field name sent to multer (default: profileImage) */
  fieldName?: string;
  /** Called after upload/delete with the new image URL (or null) */
  onImageChange?: (url: string | null) => void;
  /** Size in px – the avatar diameter. Default 120 */
  size?: number;
}

export default function ProfileImageUpload({
  currentImage,
  fallbackText = "?",
  uploadUrl = "/auth/profile-image",
  deleteUrl = "/auth/profile-image",
  fieldName = "profileImage",
  onImageChange,
  size = 120,
}: ProfileImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayImage = preview || currentImage;

  /* ─── Upload handler ───────────────────────────────── */
  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5 MB");
        return;
      }

      // Show local preview immediately
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);

      const formData = new FormData();
      formData.append(fieldName, file);

      setUploading(true);
      try {
        const res = await api.put(uploadUrl, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const url: string = res.data.user?.profileImage ?? res.data.profileImage ?? localUrl;
        setPreview(url);
        onImageChange?.(url);
        toast.success("Image uploaded");
      } catch (err: unknown) {
        setPreview(null);
        const error = err as { response?: { data?: { message?: string } } };
        toast.error(error.response?.data?.message || "Upload failed");
      } finally {
        URL.revokeObjectURL(localUrl);
        setUploading(false);
      }
    },
    [fieldName, uploadUrl, onImageChange]
  );

  /* ─── Delete handler ───────────────────────────────── */
  const handleDelete = useCallback(async () => {
    setUploading(true);
    try {
      await api.delete(deleteUrl);
      setPreview(null);
      onImageChange?.(null);
      toast.success("Image removed");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setUploading(false);
    }
  }, [deleteUrl, onImageChange]);

  /* ─── Drag & drop ──────────────────────────────────── */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = ""; // allow re-selecting same file
  };

  /* ─── Render ───────────────────────────────────────── */
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar circle */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative rounded-full overflow-hidden cursor-pointer group
          border-2 transition-colors select-none
          ${dragOver
            ? "border-indigo-500 ring-2 ring-indigo-300"
            : "border-gray-200 dark:border-gray-600 hover:border-indigo-400"
          }`}
        style={{ width: size, height: size }}
        role="button"
        tabIndex={0}
        aria-label="Upload profile image"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-3xl font-bold">
            {fallbackText}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          {uploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50 transition-colors"
        >
          <Upload className="h-4 w-4" />
          {displayImage ? "Change" : "Upload"}
        </button>

        {displayImage && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={uploading}
            className="flex items-center gap-1.5 text-sm font-medium text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Drag & drop or click · JPG, PNG · max 5 MB
      </p>
    </div>
  );
}
