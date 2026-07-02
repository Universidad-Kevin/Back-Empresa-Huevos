import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: "camporganic/productos", resource_type: "image", ...options },
        (error, result) => (error ? reject(error) : resolve(result))
      )
      .end(buffer);
  });

export default cloudinary;
