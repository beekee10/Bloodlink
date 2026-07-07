import express from 'express';
import { authenticateToken, checkRole } from '../middleware/auth.js';
import {getProfile, updateProfile, getDashboard, getHistory, getNotifications, markNotificationAsRead} from '../controllers/userController.js';

const router = express.Router();

// Get donor profile
router.get('/profile', authenticateToken, checkRole(['DONOR']), getProfile);

// Update donor profile
router.put('/profile', authenticateToken, checkRole(['DONOR']), updateProfile);

// Get Nearby Blood Requests for Donor Dashboard
router.get('/dashboard', authenticateToken, checkRole(['DONOR']), getDashboard);

// Get user donation history (list applications)
router.get('/history', authenticateToken, checkRole(['DONOR']), getHistory);

// Notifications
router.get('/notifications', authenticateToken, getNotifications);

router.put('/notifications/:id/read', authenticateToken, markNotificationAsRead);

export default router;
