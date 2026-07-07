import mongoose from 'mongoose';
import { BloodRequest, Donation } from '../models/mongooseModels.js';

/**
 * Create a new blood request.
 */
async function createBloodRequest({
  hospitalId,
  bloodGroup,
  unitsRequired,
  emergencyLevel,
  description,
  requiredBefore,
  radius,
  aiPriority,
  aiScore,
  aiReason
}) {
  const reqObj = await BloodRequest.create({
    hospitalId: new mongoose.Types.ObjectId(hospitalId),
    bloodGroup,
    unitsRequired: parseInt(unitsRequired),
    emergencyLevel,
    description,
    requiredBefore: new Date(requiredBefore),
    radius: parseInt(radius) || 10,
    aiPriority,
    aiScore,
    aiReason,
    status: 'OPEN'
  });
  
  const res = reqObj.toObject();
  res.id = res._id.toString();
  res.hospitalId = res.hospitalId.toString();
  return res;
}

/**
 * Find blood request by ID.
 */
async function findById(id) {
  if (!id) return null;
  const reqObj = await BloodRequest.findById(id).lean();
  if (reqObj) {
    reqObj.id = reqObj._id.toString();
    reqObj.hospitalId = reqObj.hospitalId.toString();
  }
  return reqObj;
}

/**
 * Find all blood requests with conditions.
 */
async function findMany(where = {}) {
  const query = { ...where };
  if (query.hospitalId && typeof query.hospitalId === 'string') {
    query.hospitalId = new mongoose.Types.ObjectId(query.hospitalId);
  }

  const requests = await BloodRequest.find(query).sort({ createdAt: -1 }).lean();
  return requests.map(r => ({
    ...r,
    id: r._id.toString(),
    hospitalId: r.hospitalId.toString()
  }));
}

/**
 * Update a blood request's status (e.g. COMPLETED, CANCELLED).
 */
async function updateStatus(id, status) {
  const reqObj = await BloodRequest.findByIdAndUpdate(id, { status }, { new: true }).lean();
  if (reqObj) {
    reqObj.id = reqObj._id.toString();
    reqObj.hospitalId = reqObj.hospitalId.toString();
  }
  return reqObj;
}

/**
 * Count total active requests.
 */
async function countActive() {
  return BloodRequest.countDocuments({ status: 'OPEN' });
}

/**
 * Count requests for a hospital by status.
 */
async function countByHospitalIdAndStatus(hospitalId, status) {
  return BloodRequest.countDocuments({ hospitalId: new mongoose.Types.ObjectId(hospitalId), status });
}

/**
 * Find all blood requests created by a specific hospital, including applications count.
 */
async function findManyByHospitalId(hospitalId) {
  const requests = await BloodRequest.find({ hospitalId: new mongoose.Types.ObjectId(hospitalId) }).sort({ createdAt: -1 }).lean();
  for (const r of requests) {
    r.id = r._id.toString();
    r.hospitalId = r.hospitalId.toString();
    
    // Count applications for this request
    const appCount = await Donation.countDocuments({ requestId: r._id });
    r._count = { applications: appCount };
  }
  return requests;
}

export {
  createBloodRequest,
  findById,
  findMany,
  updateStatus,
  countActive,
  countByHospitalIdAndStatus,
  findManyByHospitalId
};
