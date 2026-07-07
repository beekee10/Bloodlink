import express from 'express';
import { authenticateToken, checkRole } from '../middleware/auth.js';
import { createRequest, getAllRequests, getRequestById, getAISuggestion, closeRequest } from '../controllers/requestController.js';

const router = express.Router();

// 1. CREATE BLOOD REQUEST (Includes AI Emergency Priority & Automatic Nearby Matching/Notifications)
router.post('/', authenticateToken, checkRole(['HOSPITAL']), createRequest);

// 2. LIST ALL BLOOD REQUESTS (Used by Admin or general feeds)
router.get('/', authenticateToken,  getAllRequests);

// 3. GET BLOOD REQUEST BY ID (Includes AI Donor Ranking for Hospital view)
router.get('/:id', authenticateToken, getRequestById);

// AI Feature 2: Smart Request Suggestion Generator (Gemini Wrapper)
router.post('/ai-suggest', authenticateToken, checkRole(['HOSPITAL']), getAISuggestion);

// Close/Complete Request
router.put('/:id/close', authenticateToken, checkRole(['HOSPITAL']), closeRequest);

export default router;
