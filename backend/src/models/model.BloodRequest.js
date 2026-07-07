import mongoose from 'mongoose';

const BloodRequestSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bloodGroup: { type: String, required: true },
  unitsRequired: { type: Number, required: true },
  emergencyLevel: { type: String, default: 'NORMAL' },
  description: { type: String, required: true },
  requiredBefore: { type: Date, required: true },
  radius: { type: Number, default: 10 },
  status: { type: String, enum: ['OPEN', 'COMPLETED', 'CANCELLED'], default: 'OPEN' },
  aiPriority: String,
  aiScore: Number,
  aiReason: String
}, { timestamps: true });

const BloodRequest = mongoose.models.BloodRequest || mongoose.model('BloodRequest', BloodRequestSchema);

export default BloodRequest;
