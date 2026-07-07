import mongoose from 'mongoose';
import { User, DonorProfile, HospitalProfile, Donation } from '../models/mongooseModels.js';

/**
 * Find user by email with profiles included.
 */
async function findByEmail(email) {
  const user = await User.findOne({ email }).lean();
  if (!user) return null;

  user.id = user._id.toString();

  user.donorProfile = await DonorProfile.findOne({ userId: user._id }).lean();
  if (user.donorProfile) {
    user.donorProfile.id = user.donorProfile._id.toString();
    user.donorProfile.userId = user.donorProfile.userId.toString();
  }

  user.hospitalProfile = await HospitalProfile.findOne({ userId: user._id }).lean();
  if (user.hospitalProfile) {
    user.hospitalProfile.id = user.hospitalProfile._id.toString();
    user.hospitalProfile.userId = user.hospitalProfile.userId.toString();
  }

  return user;
}

/**
 * Find user by ID with profiles included.
 */
async function findById(id) {
  if (!id) return null;
  const user = await User.findById(id).lean();
  if (!user) return null;

  user.id = user._id.toString();

  user.donorProfile = await DonorProfile.findOne({ userId: user._id }).lean();
  if (user.donorProfile) {
    user.donorProfile.id = user.donorProfile._id.toString();
    user.donorProfile.userId = user.donorProfile.userId.toString();
  }

  user.hospitalProfile = await HospitalProfile.findOne({ userId: user._id }).lean();
  if (user.hospitalProfile) {
    user.hospitalProfile.id = user.hospitalProfile._id.toString();
    user.hospitalProfile.userId = user.hospitalProfile.userId.toString();
  }

  return user;
}

/**
 * Create a user along with their donor or hospital profile.
 */
async function createUserWithProfile({
  email,
  password,
  role,
  name,
  phone,
  address,
  latitude,
  longitude,
  additionalDetails,
  picture
}) {
  const newUser = await User.create({
    email,
    password,
    role
  });

  const userId = newUser._id;

  if (role === 'DONOR') {
    const { bloodGroup, age, gender, weight } = additionalDetails || {};
    await DonorProfile.create({
      userId,
      name,
      phone: phone || '',
      address: address || '',
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
      bloodGroup: bloodGroup || 'O+',
      age: parseInt(age) || 25,
      gender: gender || 'Male',
      weight: parseFloat(weight) || 70,
      availability: true,
      profilePicture: picture || ''
    });
  } else if (role === 'HOSPITAL') {
    const { licenseNumber } = additionalDetails || {};
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 14);

    await HospitalProfile.create({
      userId,
      name,
      address: address || '',
      phone: phone || '',
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
      licenseNumber: licenseNumber || 'TEMP-LIC-000',
      isVerified: false,
      subscriptionStatus: 'TRIAL',
      trialEndsAt: trialEnds
    });
  }

  const result = newUser.toObject();
  result.id = result._id.toString();
  return result;
}

/**
 * Find a donor profile by its user ID.
 */
async function findDonorProfileByUserId(userId) {
  const profile = await DonorProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();
  if (profile) {
    profile.id = profile._id.toString();
    profile.userId = profile.userId.toString();
  }
  return profile;
}

/**
 * Find a hospital profile by its user ID.
 */
async function findHospitalProfileByUserId(userId) {
  const profile = await HospitalProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();
  if (profile) {
    profile.id = profile._id.toString();
    profile.userId = profile.userId.toString();
  }
  return profile;
}

/**
 * Update donor profile.
 */
async function updateDonorProfile(userId, data) {
  const {
    name,
    phone,
    address,
    latitude,
    longitude,
    bloodGroup,
    age,
    gender,
    weight,
    availability,
    lastDonationDate
  } = data;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (address !== undefined) updateData.address = address;
  if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
  if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
  if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
  if (age !== undefined) updateData.age = parseInt(age);
  if (gender !== undefined) updateData.gender = gender;
  if (weight !== undefined) updateData.weight = parseFloat(weight);
  if (availability !== undefined) updateData.availability = availability;
  if (lastDonationDate !== undefined) {
    updateData.lastDonationDate = lastDonationDate ? new Date(lastDonationDate) : null;
  }

  const profile = await DonorProfile.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    updateData,
    { new: true }
  ).lean();

  if (profile) {
    profile.id = profile._id.toString();
    profile.userId = profile.userId.toString();
  }
  return profile;
}

/**
 * Update hospital profile.
 */
async function updateHospitalProfile(userId, data) {
  const { name, address, phone, latitude, longitude, licenseNumber } = data;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (address !== undefined) updateData.address = address;
  if (phone !== undefined) updateData.phone = phone;
  if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
  if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
  if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;

  const profile = await HospitalProfile.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    updateData,
    { new: true }
  ).lean();

  if (profile) {
    profile.id = profile._id.toString();
    profile.userId = profile.userId.toString();
  }
  return profile;
}

/**
 * Cascade delete user and profiles.
 */
async function deleteUser(id) {
  await DonorProfile.deleteOne({ userId: new mongoose.Types.ObjectId(id) });
  await HospitalProfile.deleteOne({ userId: new mongoose.Types.ObjectId(id) });
  return User.findByIdAndDelete(id);
}

/**
 * Count total users with DONOR role.
 */
async function countDonors() {
  return User.countDocuments({ role: 'DONOR' });
}

/**
 * Count total users with HOSPITAL role.
 */
async function countHospitals() {
  return User.countDocuments({ role: 'HOSPITAL' });
}

/**
 * Get all hospital users with profiles.
 */
async function findAllHospitals() {
  const hospitals = await User.find({ role: 'HOSPITAL' }).lean();
  for (const h of hospitals) {
    h.id = h._id.toString();
    h.hospitalProfile = await HospitalProfile.findOne({ userId: h._id }).lean();
    if (h.hospitalProfile) {
      h.hospitalProfile.id = h.hospitalProfile._id.toString();
      h.hospitalProfile.userId = h.hospitalProfile.userId.toString();
    }
  }
  return hospitals;
}

/**
 * Find hospital users that are pending verification.
 */
async function findPendingHospitals() {
  const pendingProfiles = await HospitalProfile.find({ isVerified: false }).lean();
  const userIds = pendingProfiles.map(p => p.userId);
  const users = await User.find({ _id: { $in: userIds } }).lean();

  for (const u of users) {
    u.id = u._id.toString();
    u.hospitalProfile = pendingProfiles.find(p => p.userId.toString() === u.id);
    if (u.hospitalProfile) {
      u.hospitalProfile.id = u.hospitalProfile._id.toString();
      u.hospitalProfile.userId = u.hospitalProfile.userId.toString();
    }
  }
  return users;
}

/**
 * Update hospital verification status.
 */
async function updateHospitalVerification(userId, verify) {
  const profile = await HospitalProfile.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    { isVerified: verify === true },
    { new: true }
  ).lean();

  if (profile) {
    profile.id = profile._id.toString();
    profile.userId = profile.userId.toString();
  }
  return profile;
}

/**
 * Find donor users by blood group, optionally including donation history.
 */
async function findDonorsByBloodGroup(bloodGroup, includeDonations = false) {
  const profiles = await DonorProfile.find({ bloodGroup }).lean();
  const userIds = profiles.map(p => p.userId);

  const users = await User.find({ _id: { $in: userIds }, role: 'DONOR' }).lean();

  for (const u of users) {
    u.id = u._id.toString();
    u.donorProfile = profiles.find(p => p.userId.toString() === u.id);
    if (u.donorProfile) {
      u.donorProfile.id = u.donorProfile._id.toString();
      u.donorProfile.userId = u.donorProfile.userId.toString();
    }

    if (includeDonations) {
      const donations = await Donation.find({ donorId: u._id }).lean();
      u.donations = donations.map(d => ({
        ...d,
        id: d._id.toString(),
        requestId: d.requestId.toString(),
        donorId: d.donorId.toString()
      }));
    } else {
      u.donations = [];
    }
  }

  return users;
}

export {
  findByEmail,
  findById,
  createUserWithProfile,
  findDonorProfileByUserId,
  findHospitalProfileByUserId,
  updateDonorProfile,
  updateHospitalProfile,
  deleteUser,
  countDonors,
  countHospitals,
  findAllHospitals,
  findPendingHospitals,
  updateHospitalVerification,
  findDonorsByBloodGroup
};
