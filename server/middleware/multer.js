import multer from "multer";

const storage = multer.memoryStorage();
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_request, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error("Avatar must be a JPEG, PNG, WebP or GIF image"));
    }
    return callback(null, true);
  }
});

export default upload;
