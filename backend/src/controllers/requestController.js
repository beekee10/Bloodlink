import { classifyEmergency, generateSmartRequest } from '../services/gemini.js';
import { isDonorMedicallyEligible, calculateDistance, rankDonors } from '../services/matching.js';
import * as userService from '../services/userService.js';
import * as bloodRequestService from '../services/bloodRequestService.js';
import * as notificationService from '../services/notificationService.js';

/**
 * Create a new blood request with AI classification and notification targeting.
 */
async function createRequest(req, res) {
  const { bloodGroup, unitsRequired, emergencyLevel, description, requiredBefore, radius } = req.body;

  if (!bloodGroup || !unitsRequired || !description || !requiredBefore) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  try {
    // Check if hospital profile is verified and active
    const hospital = await userService.findById(req.user.id);

    if (!hospital || !hospital.hospitalProfile) {
      return res.status(404).json({ error: 'Hospital profile not found.' });
    }

    if (!hospital.hospitalProfile.isVerified) {
      return res.status(403).json({ error: 'Your hospital account is awaiting Admin verification. You cannot post requests yet.' });
    }

    // Check trial & subscription expiration
    const now = new Date();
    if (hospital.hospitalProfile.subscriptionStatus === 'TRIAL' && now > new Date(hospital.hospitalProfile.trialEndsAt)) {
      return res.status(403).json({ error: 'Your 14-day free trial has expired. Please buy a membership plan in the subscription tab to continue posting blood requests.' });
    }
    if (hospital.hospitalProfile.subscriptionStatus === 'EXPIRED') {
      return res.status(403).json({ error: 'Your membership subscription has expired. Please renew your plan in the subscription tab to continue.' });
    }
    if (hospital.hospitalProfile.subscriptionStatus === 'ACTIVE' && hospital.hospitalProfile.subscriptionEndsAt && now > new Date(hospital.hospitalProfile.subscriptionEndsAt)) {
      return res.status(403).json({ error: 'Your active membership subscription has expired. Please renew your plan in the subscription tab to continue.' });
    }

    // AI priority classification via Gemini
    console.log('Running Gemini AI priority classification...');
    const aiClassification = await classifyEmergency(description);

    // Create blood request in DB
    const request = await bloodRequestService.createBloodRequest({
      hospitalId: req.user.id,
      bloodGroup,
      unitsRequired,
      emergencyLevel,
      description,
      requiredBefore,
      radius,
      aiPriority: aiClassification.priority,
      aiScore: aiClassification.score,
      aiReason: aiClassification.reason
    });

    // --- Geolocation & Matching Flow ---
    const donors = await userService.findDonorsByBloodGroup(bloodGroup, false);

    const hospitalLat = hospital.hospitalProfile.latitude;
    const hospitalLon = hospital.hospitalProfile.longitude;
    const matchRadius = request.radius;

    let matchedDonorsCount = 0;

    // Filter matched and eligible donors
    for (const donor of donors) {
      const profile = donor.donorProfile;
      if (!profile) continue;

      const distance = calculateDistance(hospitalLat, hospitalLon, profile.latitude, profile.longitude);
      const isEligible = isDonorMedicallyEligible(profile.lastDonationDate);
      const isAvailable = profile.availability;

      if (distance <= matchRadius && isEligible && isAvailable) {
        matchedDonorsCount++;

        // Create in-app notification
        await notificationService.createNotification(
          donor.id,
          `🚨 Emergency Blood Need: ${bloodGroup}`,
          `${hospital.hospitalProfile.name} requires ${unitsRequired} units of ${bloodGroup} blood within ${distance} km of your location. Emergency Score: ${request.aiScore} (${request.aiPriority}).`
        );

        // Mock Email
        console.log(`[EMAIL NOTIFICATION SENT] To: ${donor.email}. Subject: Blood Request Alert. Msg: Hospital ${hospital.hospitalProfile.name} needs ${bloodGroup} blood near you.`);
      }
    }

    res.status(201).json({
      request,
      matchedDonorsCount,
      aiFeedback: aiClassification
    });

  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Server error creating request.' });
  }
}

/**
 * List all blood requests (enriched with hospital names).
 */
async function getAllRequests(req, res) {
  try {
    const requests = await bloodRequestService.findMany();

    // Populate hospital names
    const enrichedRequests = [];
    for (const reqObj of requests) {
      const hosp = await userService.findById(reqObj.hospitalId);
      enrichedRequests.push({
        ...reqObj,
        hospitalName: hosp?.hospitalProfile?.name || 'Verified Hospital'
      });
    }

    res.json(enrichedRequests);
  } catch (error) {
    res.status(500).json({ error: 'Server error loading requests.' });
  }
}

/**
 * Get blood request by ID, including ranked candidate donors.
 */
async function getRequestById(req, res) {
  const { id } = req.params;
  try {
    const request = await bloodRequestService.findById(id);

    if (!request) {
      return res.status(404).json({ error: 'Blood request not found.' });
    }

    // Get hospital coords
    const hospital = await userService.findById(request.hospitalId);
    if (!hospital || !hospital.hospitalProfile) {
      return res.status(404).json({ error: 'Associated hospital profile not found.' });
    }

    // Find and rank candidate donors
    const potentialDonors = await userService.findDonorsByBloodGroup(request.bloodGroup, true);

    const eligibleDonors = potentialDonors.filter(donor => {
      const profile = donor.donorProfile;
      return profile && isDonorMedicallyEligible(profile.lastDonationDate);
    });

    const rankedDonors = rankDonors(
      eligibleDonors,
      hospital.hospitalProfile.latitude,
      hospital.hospitalProfile.longitude,
      request.radius
    );

    res.json({
      request,
      hospital: hospital.hospitalProfile,
      rankedDonors
    });

  } catch (error) {
    console.error('Get request details error:', error);
    res.status(500).json({ error: 'Server error fetching request details.' });
  }
}

/**
 * Generate smart request text using Gemini.
 */
async function getAISuggestion(req, res) {
  const { bloodGroup, unitsRequired, emergencyLevel, details } = req.body;

  if (!bloodGroup || !unitsRequired) {
    return res.status(400).json({ error: 'Blood group and units required are needed for suggestion.' });
  }

  try {
    const suggestedText = await generateSmartRequest(bloodGroup, unitsRequired, emergencyLevel || 'Normal', details);
    res.json({ suggestion: suggestedText });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate AI suggestion.' });
  }
}

/**
 * Close/complete a blood request.
 */
async function closeRequest(req, res) {
  const { id } = req.params;
  try {
    const updated = await bloodRequestService.updateStatus(id, 'COMPLETED');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to close request' });
  }
}

export {
  createRequest,
  getAllRequests,
  getRequestById,
  getAISuggestion,
  closeRequest
};
