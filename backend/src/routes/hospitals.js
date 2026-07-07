import express from 'express';
import { authenticateToken, checkRole } from '../middleware/auth.js';
import { getProfile, updateProfile, getDashboard, paymentRazorpay, verifyRazorpay } from '../controllers/hospitalController.js';

const router = express.Router();

// Get Hospital Profile
router.get('/profile', authenticateToken, checkRole(['HOSPITAL']), getProfile);

// Update Hospital Profile
router.put('/profile', authenticateToken, checkRole(['HOSPITAL']), updateProfile);

// Get Hospital Dashboard Analytics & Stats
router.get('/dashboard', authenticateToken, checkRole(['HOSPITAL']), getDashboard);

// Razorpay Subscriptions Payment System
router.post('/payment-razorpay', authenticateToken, checkRole(['HOSPITAL']), paymentRazorpay);
router.post('/verify-razorpay', authenticateToken, checkRole(['HOSPITAL']), verifyRazorpay);

export default router;
