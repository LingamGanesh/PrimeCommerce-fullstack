import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLODINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY || process.env.CLODINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLODINARY_API_SECRET_KEY;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const uploadImageClodinary = async (image) => {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Image upload service is not configured");
  }
  if (!image?.buffer || !Buffer.isBuffer(image.buffer) || image.buffer.length === 0) {
    throw new Error("A valid image file is required");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "primecommerce" },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url) return reject(new Error("Image upload did not return a secure URL"));
        return resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(image.buffer);
  });
};

export default uploadImageClodinary;
