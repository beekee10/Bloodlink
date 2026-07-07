import express from 'express';
import { register, login, googleLogin, getMe } from '../controllers/authController.js';

const router = express.Router();

// 1. REGISTER USER
router.post('/register', register);

// 2. LOGIN USER
router.post('/login', login);

// 3. MOCK GOOGLE LOGIN
router.post('/google', googleLogin);

// 4. GET CURRENT SESSION INFO
router.get('/me', getMe);

export default router;
