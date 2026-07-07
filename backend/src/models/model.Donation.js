import mongoose from 'mongoose';

const DonationSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest', required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['APPLIED', 'APPROVED', 'SCHEDULED', 'COMPLETED', 'REJECTED'], default: 'APPLIED' },
  scheduledDate: Date,
  completedAt: Date,
  certificateUrl: String
}, { timestamps: true });

const Donation = mongoose.models.Donation || mongoose.model('Donation', DonationSchema);

export default Donation;
