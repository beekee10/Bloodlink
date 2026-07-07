import express from 'express';
import { authenticateToken, checkRole } from '../middleware/auth.js';
import { getDashboard, getAllHospitals, verifyHospital, deleteUser } from '../controllers/adminController.js';

const router = express.Router();

// 1. ADMIN DASHBOARD ANALYTICS
router.get('/dashboard', authenticateToken, checkRole(['ADMIN']), getDashboard);

// 2. LIST ALL HOSPITALS
router.get('/hospitals', authenticateToken, checkRole(['ADMIN']), getAllHospitals);

// 3. VERIFY HOSPITAL LICENSE (Approve/Reject)
router.put('/hospitals/:id/verify', authenticateToken, checkRole(['ADMIN']), verifyHospital);

// 4. BLOCK/REMOVE USER OR HOSPITAL
router.delete('/users/:id', authenticateToken, checkRole(['ADMIN']), deleteUser);

export default router;
