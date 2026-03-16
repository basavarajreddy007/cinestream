import express from 'express';
import multer from 'multer';
import { uploadVideo, getVideos, getVideoById, deleteVideo, likeVideo, addComment, rateVideo, saveProgress } from '../controllers/video.controller.js';
import { protect, adminOnly, creatorOrAdmin } from '../middleware/auth.middleware.js';
import { uploadVideo as cloudinaryUpload, uploadImage } from '../utils/cloudinary.js';

const router = express.Router();

const uploadFields = multer({
  storage: multer.memoryStorage(),
}).fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]);

// Use cloudinary storage for video upload
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../utils/cloudinary.js';
import multerPkg from 'multer';

const storage = multerPkg({
  storage: new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      if (file.fieldname === 'video') {
        return { folder: 'ott/videos', resource_type: 'video', allowed_formats: ['mp4', 'mov', 'avi'] };
      }
      return { folder: 'ott/thumbnails', resource_type: 'image', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] };
    },
  }),
});

router.post('/upload', protect, creatorOrAdmin, storage.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), uploadVideo);
router.get('/', getVideos);
router.get('/:id', getVideoById);
router.delete('/:id', protect, adminOnly, deleteVideo);
router.post('/:id/like', protect, likeVideo);
router.post('/:id/comment', protect, addComment);
router.post('/:id/rate', protect, rateVideo);
router.post('/:id/progress', protect, saveProgress);

export default router;
