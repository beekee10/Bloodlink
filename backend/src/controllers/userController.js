import { calculateDistance } from '../services/matching.js';
import * as userService from '../services/userService.js';
import * as bloodRequestService from '../services/bloodRequestService.js';
import * as donationService from '../services/donationService.js';
import * as notificationService from '../services/notificationService.js';

/**
 * Get donor profile.
 */
async function getProfile(req, res) {
  try {
    const profile = await userService.findDonorProfileByUserId(req.user.id);
    if (!profile) return res.status(404).json({ error: 'Donor profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}

/**
 * Update donor profile.
 */
async function updateProfile(req, res) {
  try {
    const updatedProfile = await userService.updateDonorProfile(req.user.id, req.body);
    res.json(updatedProfile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

/**
 * Get nearby blood requests for donor dashboard.
 */
async function getDashboard(req, res) {
  try {
    const donor = await userService.findById(req.user.id);

    if (!donor || !donor.donorProfile) {
      return res.status(404).json({ error: 'Donor profile details not found' });
    }

    const { latitude: donorLat, longitude: donorLon, bloodGroup: donorBlood } = donor.donorProfile;

    // Fetch all open requests
    const openRequests = await bloodRequestService.findMany({ status: 'OPEN' });

    // Resolve hospital coordinates and map details
    const requestsWithDistance = [];
    for (const reqObj of openRequests) {
      const hospitalUser = await userService.findById(reqObj.hospitalId);

      if (!hospitalUser || !hospitalUser.hospitalProfile) continue;

      const { latitude: hospLat, longitude: hospLon, name: hospName, address: hospAddr } = hospitalUser.hospitalProfile;
      const distance = calculateDistance(donorLat, donorLon, hospLat, hospLon);

      // Check if donor is within the request's targeted matching radius
      const inRadius = distance <= reqObj.radius;

      // Determine if blood group matches
      const isDirectMatch = reqObj.bloodGroup === donorBlood;

      requestsWithDistance.push({
        ...reqObj,
        hospitalName: hospName,
        hospitalAddress: hospAddr,
        hospitalLatitude: hospLat,
        hospitalLongitude: hospLon,
        distance,
        inRadius,
        isDirectMatch
      });
    }

    // Sort by emergency/distance: nearest & matches first
    requestsWithDistance.sort((a, b) => {
      if (a.isDirectMatch && !b.isDirectMatch) return -1;
      if (!a.isDirectMatch && b.isDirectMatch) return 1;
      return a.distance - b.distance;
    });

    res.json({
      donorProfile: donor.donorProfile,
      nearbyRequests: requestsWithDistance
    });

  } catch (error) {
    console.error('Donor dashboard error:', error);
    res.status(500).json({ error: 'Server error loading dashboard' });
  }
}

/**
 * Get donor donation history (list applications).
 */
async function getHistory(req, res) {
  try {
    const donations = await donationService.findManyByDonorId(req.user.id);

    // Populate hospital names
    const donationsWithHospitals = [];
    for (const don of donations) {
      const hospitalUser = await userService.findById(don.request.hospitalId);
      donationsWithHospitals.push({
        ...don,
        hospitalName: hospitalUser?.hospitalProfile?.name || 'Unknown Hospital'
      });
    }

    res.json(donationsWithHospitals);
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

/**
 * Fetch notifications for user.
 */
async function getNotifications(req, res) {
  try {
    const notifications = await notificationService.findManyByUserId(req.user.id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching notifications' });
  }
}

/**
 * Mark notification as read.
 */
async function markNotificationAsRead(req, res) {
  const { id } = req.params;
  try {
    await notificationService.markAsRead(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}

export {
  getProfile,
  updateProfile,
  getDashboard,
  getHistory,
  getNotifications,
  markNotificationAsRead
};
