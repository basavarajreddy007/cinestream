import express from 'express';
import { getUpcoming, createUpcoming, toggleInterested, deleteUpcoming } from '../controllers/upcoming.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { uploadImage } from '../utils/cloudinary.js';

const router = express.Router();

router.get('/', getUpcoming);
router.post('/', protect, adminOnly, uploadImage.single('thumbnail'), createUpcoming);
router.post('/:id/interested', protect, toggleInterested);
router.delete('/:id', protect, adminOnly, deleteUpcoming);

export default router;
