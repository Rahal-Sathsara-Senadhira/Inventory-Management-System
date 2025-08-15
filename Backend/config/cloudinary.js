// Backend/config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";

/**
 * Configure Cloudinary from environment variables.
 * Make sure your .env has:
 *   CLOUDINARY_CLOUD_NAME=xxx
 *   CLOUDINARY_API_KEY=xxx
 *   CLOUDINARY_API_SECRET=xxx
 *   CLOUDINARY_FOLDER=ims      # optional
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a file buffer to Cloudinary using upload_stream.
 * Works for images, pdfs, etc. (resource_type:auto)
 *
 * @param {Buffer} buffer - file buffer (from multer memoryStorage)
 * @param {string} filename - original filename
 * @param {string} folder - folder path inside your Cloudinary account
 * @returns {Promise<import('cloudinary').UploadApiResponse>}
 */
export const uploadBuffer = (buffer, filename, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        filename_override: filename,
        use_filename: true,
        unique_filename: true,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

export default cloudinary;
