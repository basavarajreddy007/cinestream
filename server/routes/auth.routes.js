import express from 'express';
import { sendOTP, verifyOTP, getMe, logout } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;
