import { isValidImageUpload } from "../utils/imageSignature.js";

export default function validateImageUpload(req, res, next) {
  if (!req.file) return next();
  if (!isValidImageUpload(req.file)) {
    return res.status(400).json({
      success: false,
      error: true,
      message: "The uploaded file content does not match a supported JPEG, PNG, WebP or GIF image."
    });
  }
  return next();
}