import express from 'express';
import { chatFAQ } from '../controllers/aiController.js';

const router = express.Router();

// AI Chatbot FAQ assistant
router.post('/chat', chatFAQ);

export default router;
