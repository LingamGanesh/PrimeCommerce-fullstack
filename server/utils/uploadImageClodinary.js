import { v2 as cloudinary } from "cloudinary";

const uploadImageClodinary = async (image) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLODINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY || process.env.CLODINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLODINARY_API_SECRET_KEY;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in server/.env.");
  }

  const buffer = image?.buffer || (image?.arrayBuffer ? Buffer.from(await image.arrayBuffer()) : null);
  if (!buffer?.length) {
    throw new Error("The selected image is empty or invalid.");
  }

  // Configure lazily: dotenv.config() runs in the server entry point after modules load.
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "primecommerce/avatars",
        resource_type: "image",
        transformation: [{ width: 600, height: 600, crop: "limit", quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url) return reject(new Error("Cloudinary did not return an image URL."));
        resolve(result);
      }
    ).end(buffer);
  });
};

export default uploadImageClodinary;
