import * as userService from '../services/userService.js';
import * as bloodRequestService from '../services/bloodRequestService.js';
import * as donationService from '../services/donationService.js';
import * as notificationService from '../services/notificationService.js';

/**
 * Get Admin dashboard stats and pending hospital registrations.
 */
async function getDashboard(req, res) {
  try {
    const donorsCount = await userService.countDonors();
    const hospitalsCount = await userService.countHospitals();
    
    const activeRequests = await bloodRequestService.countActive();
    const completedDonations = await donationService.countCompleted();
    
    // Get list of hospitals that are pending verification
    const pendingHospitals = await userService.findPendingHospitals();

    res.json({
      stats: {
        donorsCount,
        hospitalsCount,
        activeRequests,
        completedDonations
      },
      pendingHospitals: pendingHospitals.map(h => ({
        id: h.id,
        email: h.email,
        name: h.hospitalProfile?.name,
        address: h.hospitalProfile?.address,
        phone: h.hospitalProfile?.phone,
        licenseNumber: h.hospitalProfile?.licenseNumber,
        trialEndsAt: h.hospitalProfile?.trialEndsAt
      }))
    });
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    res.status(500).json({ error: 'Server error loading admin dashboard.' });
  }
}

/**
 * Get list of all hospital profiles.
 */
async function getAllHospitals(req, res) {
  try {
    const hospitals = await userService.findAllHospitals();
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load hospitals list.' });
  }
}

/**
 * Verify or unverify a hospital profile.
 */
async function verifyHospital(req, res) {
  const { id } = req.params;
  const { verify } = req.body; // true to verify, false to unverify

  try {
    const hospitalProfile = await userService.findHospitalProfileByUserId(id);

    if (!hospitalProfile) {
      return res.status(404).json({ error: 'Hospital profile not found.' });
    }

    const updatedProfile = await userService.updateHospitalVerification(id, verify);

    // Notify Hospital User
    await notificationService.createNotification(
      id,
      verify ? '✓ Account Verified!' : 'Account Verification Removed',
      verify 
        ? 'Congratulations! Your hospital profile has been verified by the Admin. You can now post blood requests.' 
        : 'Your hospital verification has been suspended. Please check with support.'
    );

    res.json(updatedProfile);
  } catch (error) {
    console.error('Verify hospital error:', error);
    res.status(500).json({ error: 'Failed to verify hospital.' });
  }
}

/**
 * Delete a user profile (cascades user and related profile).
 */
async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    await userService.deleteUser(id);
    res.json({ success: true, message: 'User account removed/blocked successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to block/remove user account.' });
  }
}

export {
  getDashboard,
  getAllHospitals,
  verifyHospital,
  deleteUser
};
