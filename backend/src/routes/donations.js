import express from 'express';
import { authenticateToken, checkRole } from '../middleware/auth.js';
import { applyDonation, getApplicationsByRequest, updateDonationStatus, getCertificate } from '../controllers/donationController.js';

const router = express.Router();

// 1. DONOR APPLIES FOR A BLOOD REQUEST
router.post('/apply', authenticateToken, checkRole(['DONOR']), applyDonation);

// 2. GET APPLICATIONS FOR A SPECIFIC BLOOD REQUEST (Hospital view)
router.get('/request/:requestId', authenticateToken, checkRole(['HOSPITAL']), getApplicationsByRequest);

// 3. HOSPITAL UPDATES APPLICATION STATUS (SCHEDULED, COMPLETED, REJECTED)
router.put('/:id', authenticateToken, checkRole(['HOSPITAL']), updateDonationStatus);

// 4. DOWNLOAD / VIEW CERTIFICATE DETAILS
router.get('/certificate/:id', authenticateToken, getCertificate);

export default router;
