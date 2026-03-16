import express from 'express';
import { scriptAnalyze, scriptWriter, getRecommendations } from '../controllers/ai.controller.js';
import { protect, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/script-analyze', protect, scriptAnalyze);
router.post('/script-writer', protect, scriptWriter);
router.get('/recommendations', optionalAuth, getRecommendations);
router.get('/recommend', optionalAuth, getRecommendations);

export default router;
