import { v2 as cloudinary } from 'cloudinary';

function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

/**
 * Upload a buffer to Cloudinary and return { secure_url, public_id }.
 */
export function uploadToCloudinary(buffer, options = {}) {
  const cl = configure();
  return new Promise((resolve, reject) => {
    const stream = cl.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

/**
 * Delete a resource from Cloudinary by public_id.
 */
export function deleteFromCloudinary(publicId, resourceType = 'image') {
  return configure().uploader.destroy(publicId, { resource_type: resourceType });
}
