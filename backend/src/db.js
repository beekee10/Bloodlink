import mongoose from 'mongoose';

/**
 * Initialize connection to MongoDB.
 */
async function connectDB() {
  try {
    const connStr = process.env.DATABASE_URL || 'mongodb://localhost:27017/bloodlink';
    await mongoose.connect(connStr);
    console.log('Successfully connected to MongoDB Database.');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
}

export default connectDB;
