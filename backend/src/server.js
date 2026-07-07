import './config.js';
import express from 'express';
import cors from 'cors';
import connectDB from './db.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import hospitalRoutes from './routes/hospitals.js';
import requestRoutes from './routes/requests.js';
import donationRoutes from './routes/donations.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Status health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), service: 'BloodLink Backend API' });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An internal server error occurred.'
  });
});

// Initialize database connection and start Express server
async function startServer() {
  try {
    // Verify database connection
    await connectDB();

    app.listen(PORT, () => {
      console.log(`BloodLink Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed. Express server not started:', error);
    process.exit(1);
  }
}

startServer();
