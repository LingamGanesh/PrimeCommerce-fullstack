import multer from "multer";

const storage = multer.memoryStorage();
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      return callback(new Error("Only JPG, PNG, WEBP or GIF images are allowed."));
    }
    callback(null, true);
  },
});

export default upload;
