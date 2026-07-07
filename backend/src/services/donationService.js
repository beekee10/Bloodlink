import mongoose from 'mongoose';
import { Donation, BloodRequest, DonorProfile } from '../models/mongooseModels.js';

/**
 * Create a new donation application.
 */
async function createDonation({ requestId, donorId }) {
  return Donation.create({
    requestId: new mongoose.Types.ObjectId(requestId),
    donorId: new mongoose.Types.ObjectId(donorId),
    status: 'APPLIED'
  });
}

/**
 * Find donation by ID, including associated request.
 */
async function findById(id) {
  if (!id) return null;
  const donation = await Donation.findById(id).populate('requestId').lean();
  if (donation) {
    donation.id = donation._id.toString();
    donation.donorId = donation.donorId.toString();

    // Map request details first, then set requestId string ID
    const reqObj = donation.requestId;
    if (reqObj) {
      donation.request = {
        ...reqObj,
        id: reqObj._id.toString(),
        hospitalId: reqObj.hospitalId.toString()
      };
      donation.requestId = reqObj._id.toString();
    } else {
      donation.request = null;
      donation.requestId = donation.requestId ? donation.requestId.toString() : '';
    }
  }
  return donation;
}

/**
 * Find donation by ID with full details (donor profile & request) for certificates.
 */
async function findByIdWithDetails(id) {
  if (!id) return null;
  const donation = await Donation.findById(id).populate('donorId').populate('requestId').lean();
  if (donation) {
    donation.id = donation._id.toString();

    // Map donor details first
    const donorObj = donation.donorId;
    if (donorObj) {
      donation.donor = {
        ...donorObj,
        id: donorObj._id.toString()
      };
      donation.donorId = donorObj._id.toString();
      
      // Populate donorProfile manually
      donation.donor.donorProfile = await DonorProfile.findOne({ userId: donorObj._id }).lean();
      if (donation.donor.donorProfile) {
        donation.donor.donorProfile.id = donation.donor.donorProfile._id.toString();
        donation.donor.donorProfile.userId = donation.donor.donorProfile.userId.toString();
      }
    } else {
      donation.donor = null;
      donation.donorId = donation.donorId ? donation.donorId.toString() : '';
    }

    // Map request details
    const reqObj = donation.requestId;
    if (reqObj) {
      donation.request = {
        ...reqObj,
        id: reqObj._id.toString(),
        hospitalId: reqObj.hospitalId.toString()
      };
      donation.requestId = reqObj._id.toString();
    } else {
      donation.request = null;
      donation.requestId = donation.requestId ? donation.requestId.toString() : '';
    }
  }
  return donation;
}

/**
 * Find the first donation matching conditions.
 */
async function findFirst(where) {
  const query = { ...where };
  if (query.requestId) query.requestId = new mongoose.Types.ObjectId(query.requestId);
  if (query.donorId) query.donorId = new mongoose.Types.ObjectId(query.donorId);

  const app = await Donation.findOne(query).lean();
  if (app) {
    app.id = app._id.toString();
    app.requestId = app.requestId.toString();
    app.donorId = app.donorId.toString();
  }
  return app;
}

/**
 * Find all donations for a specific request, including donor profiles.
 */
async function findManyByRequestId(requestId) {
  const apps = await Donation.find({ requestId: new mongoose.Types.ObjectId(requestId) }).populate('donorId').sort({ createdAt: -1 }).lean();
  
  for (const app of apps) {
    app.id = app._id.toString();
    app.requestId = app.requestId.toString();

    // Map donor details first, then set donorId string
    const donorObj = app.donorId;
    if (donorObj) {
      app.donor = {
        ...donorObj,
        id: donorObj._id.toString()
      };
      app.donorId = donorObj._id.toString();

      app.donor.donorProfile = await DonorProfile.findOne({ userId: donorObj._id }).lean();
      if (app.donor.donorProfile) {
        app.donor.donorProfile.id = app.donor.donorProfile._id.toString();
        app.donor.donorProfile.userId = app.donor.donorProfile.userId.toString();
      }
    } else {
      app.donor = null;
      app.donorId = app.donorId ? app.donorId.toString() : '';
    }
  }
  return apps;
}

/**
 * Find all donations submitted by a donor, including request details.
 */
async function findManyByDonorId(donorId) {
  const donations = await Donation.find({ donorId: new mongoose.Types.ObjectId(donorId) }).populate('requestId').sort({ createdAt: -1 }).lean();
  for (const d of donations) {
    d.id = d._id.toString();
    d.donorId = d.donorId.toString();

    // Map request details first, then set requestId string ID
    const reqObj = d.requestId;
    if (reqObj) {
      d.request = {
        ...reqObj,
        id: reqObj._id.toString(),
        hospitalId: reqObj.hospitalId.toString()
      };
      d.requestId = reqObj._id.toString();
    } else {
      d.request = null;
      d.requestId = d.requestId ? d.requestId.toString() : '';
    }
  }
  return donations;
}

/**
 * Update donation status, with a transaction/update to donor availability if completed.
 */
async function updateDonationStatusTransaction(id, donorId, updateData, status) {
  const updatedDonation = await Donation.findByIdAndUpdate(id, updateData, { new: true }).lean();
  if (updatedDonation) {
    updatedDonation.id = updatedDonation._id.toString();
    updatedDonation.requestId = updatedDonation.requestId.toString();
    updatedDonation.donorId = updatedDonation.donorId.toString();
  }

  if (status === 'COMPLETED') {
    await DonorProfile.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(donorId) },
      { lastDonationDate: new Date() }
    );
  }

  return updatedDonation;
}

/**
 * Count total completed donations.
 */
async function countCompleted() {
  return Donation.countDocuments({ status: 'COMPLETED' });
}

/**
 * Count total pending donations for a specific hospital.
 */
async function countPendingByHospitalId(hospitalId) {
  const requests = await BloodRequest.find({ hospitalId: new mongoose.Types.ObjectId(hospitalId) }).select('_id').lean();
  const requestIds = requests.map(r => r._id);
  return Donation.countDocuments({
    requestId: { $in: requestIds },
    status: 'APPLIED'
  });
}

/**
 * Count total completed donations for a specific hospital.
 */
async function countCompletedByHospitalId(hospitalId) {
  const requests = await BloodRequest.find({ hospitalId: new mongoose.Types.ObjectId(hospitalId) }).select('_id').lean();
  const requestIds = requests.map(r => r._id);
  return Donation.countDocuments({
    requestId: { $in: requestIds },
    status: 'COMPLETED'
  });
}

export {
  createDonation,
  findById,
  findByIdWithDetails,
  findFirst,
  findManyByRequestId,
  findManyByDonorId,
  updateDonationStatusTransaction,
  countCompleted,
  countPendingByHospitalId,
  countCompletedByHospitalId
};
