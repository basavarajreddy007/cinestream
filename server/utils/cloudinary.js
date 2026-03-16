import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Video storage
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ott/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv'],
  },
});

// Image storage (thumbnails, avatars)
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ott/images',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1280, height: 720, crop: 'fill' }],
  },
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ott/avatars',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 200, height: 200, crop: 'fill' }],
  },
});

export const uploadVideo = multer({ storage: videoStorage });
export const uploadImage = multer({ storage: imageStorage });
export const uploadAvatar = multer({ storage: avatarStorage });
export { cloudinary };
