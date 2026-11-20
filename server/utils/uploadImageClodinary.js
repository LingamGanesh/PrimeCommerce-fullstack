import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLODINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY || process.env.CLODINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLODINARY_API_SECRET_KEY;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

const uploadImageClodinary = async (image) => {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.");
  }
  if (!image) throw new Error("No image file was provided");

  const buffer = image.buffer || Buffer.from(await image.arrayBuffer());

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder: "primecommerce" }, (error, uploadResult) => {
      if (error) return reject(error);
      if (!uploadResult?.secure_url) return reject(new Error("Cloudinary did not return an image URL"));
      resolve(uploadResult);
    }).end(buffer);
  });
};

export default uploadImageClodinary;
