const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

/**
 * Factory that creates a multer upload middleware for any resource type.
 *
 * @param {Object} options
 * @param {string}  options.folder          - Cloudinary folder name (e.g. "profile-images")
 * @param {string[]} [options.allowedFormats] - Allowed file formats (default: jpg, jpeg, png, webp)
 * @param {number}  [options.maxFileSize]    - Max file size in bytes (default: 5 MB)
 * @param {string}  [options.fieldName]     - Form field name (default: "image")
 * @param {string}  [options.transformation] - Cloudinary transformation string
 * @returns {import("express").RequestHandler}
 *
 * Usage:
 *   const { createUpload } = require("../middleware/upload");
 *   const uploadProfileImage = createUpload({ folder: "lingua-connect/profiles" });
 *   router.put("/profile-image", auth, uploadProfileImage, controller);
 */
const createUpload = ({
  folder = "lingua-connect",
  allowedFormats = ["jpg", "jpeg", "png", "webp"],
  maxFileSize = 5 * 1024 * 1024, // 5 MB
  fieldName = "image",
  transformation = "c_fill,g_face,w_400,h_400,q_auto",
} = {}) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: allowedFormats,
      transformation: transformation
        ? transformation.split(",").reduce((acc, t) => {
            const [key, value] = t.split("_");
            const paramMap = {
              c: "crop",
              g: "gravity",
              w: "width",
              h: "height",
              q: "quality",
              f: "format",
            };
            acc[paramMap[key] || key] = isNaN(value) ? value : Number(value);
            return acc;
          }, {})
        : undefined,
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter: (_req, file, cb) => {
      const ext = file.mimetype.split("/")[1];
      if (allowedFormats.includes(ext)) {
        cb(null, true);
      } else {
        cb(
          new multer.MulterError(
            "LIMIT_UNEXPECTED_FILE",
            `Only ${allowedFormats.join(", ")} files are allowed`
          )
        );
      }
    },
  });

  // Return an Express middleware that handles errors gracefully
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        const messages = {
          LIMIT_FILE_SIZE: `File too large. Maximum size is ${maxFileSize / (1024 * 1024)} MB`,
          LIMIT_UNEXPECTED_FILE: err.message || "Unexpected file field",
        };
        return res.status(400).json({
          success: false,
          message: messages[err.code] || err.message,
        });
      }
      if (err) {
        return res.status(500).json({
          success: false,
          message: "File upload failed",
          error: err.message,
        });
      }
      next();
    });
  };
};

/**
 * Delete an image from Cloudinary by its public_id or full URL.
 * Useful when replacing or removing profile images.
 *
 * @param {string} imageUrl - Full Cloudinary URL or public_id
 */
const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;
  try {
    // Extract public_id from URL   e.g. .../lingua-connect/profiles/abc123.jpg
    const parts = imageUrl.split("/");
    const uploadIdx = parts.indexOf("upload");
    if (uploadIdx === -1) return;
    const publicIdWithExt = parts.slice(uploadIdx + 2).join("/"); // skip version segment
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // Silently fail – stale images are cleaned up via Cloudinary media library
  }
};

module.exports = { createUpload, deleteImage };
