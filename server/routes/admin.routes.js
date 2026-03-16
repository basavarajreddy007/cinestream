import express from 'express';
import { getAnalytics, getUsers, updateUserRole, getScriptSubmissions } from '../controllers/admin.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/scripts', getScriptSubmissions);

export default router;
