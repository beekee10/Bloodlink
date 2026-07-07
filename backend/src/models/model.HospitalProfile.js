import mongoose from 'mongoose';

const HospitalProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 },
  licenseNumber: { type: String, default: 'TEMP-LIC-000' },
  isVerified: { type: Boolean, default: false },
  subscriptionStatus: { type: String, enum: ['TRIAL', 'ACTIVE', 'EXPIRED'], default: 'TRIAL' },
  trialEndsAt: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  subscriptionEndsAt: { type: Date, default: null },
  subscriptionPlan: {type: String,enum: ["STARTER", "PROFESSIONAL", "ENTERPRISE"],default: null},
  billingCycle: {type: String,enum: ["MONTHLY", "YEARLY"],default: null},
  subscriptionStartedAt: {type: Date,default: null},
}, { timestamps: true });

const HospitalProfile = mongoose.models.HospitalProfile || mongoose.model('HospitalProfile', HospitalProfileSchema);

export default HospitalProfile;
