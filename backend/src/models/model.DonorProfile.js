import mongoose from 'mongoose';

const DonorProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  bloodGroup: { type: String, default: 'O+' },
  age: { type: Number, default: 25 },
  gender: { type: String, default: 'Male' },
  weight: { type: Number, default: 70 },
  address: { type: String, default: '' },
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 },
  availability: { type: Boolean, default: true },
  lastDonationDate: { type: Date, default: null },
  profilePicture: { type: String, default: '' }
}, { timestamps: true });

const DonorProfile = mongoose.models.DonorProfile || mongoose.model('DonorProfile', DonorProfileSchema);

export default DonorProfile;
