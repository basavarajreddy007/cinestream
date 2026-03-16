import express from 'express';
import { updateProfile, toggleWatchlist, getWatchlist, getWatchHistory, getCreators, getCreatorById } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadAvatar } from '../utils/cloudinary.js';

const router = express.Router();

router.get('/creators', getCreators);
router.get('/creators/:id', getCreatorById);
router.put('/profile', protect, uploadAvatar.single('avatar'), updateProfile);
router.get('/watchlist', protect, getWatchlist);
router.post('/watchlist/:id', protect, toggleWatchlist);
router.get('/history', protect, getWatchHistory);

export default router;
