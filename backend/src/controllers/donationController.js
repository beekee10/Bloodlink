import * as userService from '../services/userService.js';
import * as bloodRequestService from '../services/bloodRequestService.js';
import * as donationService from '../services/donationService.js';
import * as notificationService from '../services/notificationService.js';

/**
 * Apply as a donor for a specific blood request.
 */
async function applyDonation(req, res) {
  const { requestId } = req.body;
  if (!requestId) return res.status(400).json({ error: 'Blood request ID is required.' });

  try {
    const request = await bloodRequestService.findById(requestId);

    if (!request) return res.status(404).json({ error: 'Blood request not found.' });
    if (request.status !== 'OPEN') return res.status(400).json({ error: 'This blood request is no longer active.' });

    // Check if donor already applied for this request
    const existingApp = await donationService.findFirst({
      requestId,
      donorId: req.user.id
    });

    if (existingApp) {
      return res.status(400).json({ error: 'You have already applied to this blood request.' });
    }

    // Check donor profile for eligibility
    const donor = await userService.findById(req.user.id);

    if (!donor || !donor.donorProfile) {
      return res.status(404).json({ error: 'Donor profile not found.' });
    }

    // Verify last donation cool-off
    const lastDon = donor.donorProfile.lastDonationDate;
    if (lastDon) {
      const diff = new Date().getTime() - new Date(lastDon).getTime();
      const ninetyDays = 90 * 24 * 60 * 60 * 1000;
      if (diff < ninetyDays) {
        return res.status(400).json({ error: 'Medically ineligible: You must wait at least 90 days between donations.' });
      }
    }

    // Create donation application
    const donation = await donationService.createDonation({
      requestId,
      donorId: req.user.id
    });

    // Notify the Hospital
    await notificationService.createNotification(
      request.hospitalId,
      'New Donor Application',
      `${donor.donorProfile.name} (${donor.donorProfile.bloodGroup}) has applied to your request for blood units.`
    );

    res.status(201).json(donation);
  } catch (error) {
    console.error('Apply donation error:', error);
    res.status(500).json({ error: 'Server error during application.' });
  }
}

/**
 * Get all donation applications for a specific blood request.
 */
async function getApplicationsByRequest(req, res) {
  const { requestId } = req.params;
  try {
    const applications = await donationService.findManyByRequestId(requestId);

    // Simplify returning format
    const formatted = applications.map(app => ({
      id: app.id,
      status: app.status,
      scheduledDate: app.scheduledDate,
      completedAt: app.completedAt,
      createdAt: app.createdAt,
      donor: {
        id: app.donor.id,
        email: app.donor.email,
        name: app.donor.donorProfile?.name,
        phone: app.donor.donorProfile?.phone,
        bloodGroup: app.donor.donorProfile?.bloodGroup,
        gender: app.donor.donorProfile?.gender,
        age: app.donor.donorProfile?.age,
        weight: app.donor.donorProfile?.weight
      }
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}

/**
 * Update the status of a donation application (Hospital view).
 */
async function updateDonationStatus(req, res) {
  const { id } = req.params;
  const { status, scheduledDate } = req.body; // status: "SCHEDULED" | "COMPLETED" | "REJECTED"

  if (!status) return res.status(400).json({ error: 'Status is required.' });

  try {
    const donation = await donationService.findById(id);

    if (!donation) return res.status(404).json({ error: 'Application record not found.' });

    // Validate ownership
    if (donation.request.hospitalId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized hospital operation.' });
    }

    const updateData = { status };

    if (status === 'SCHEDULED') {
      if (!scheduledDate) return res.status(400).json({ error: 'Scheduled date is required for appointment.' });
      updateData.scheduledDate = new Date(scheduledDate);
    } else if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      // Generate certificate signature/url path
      updateData.certificateUrl = `BLOODLINK-CERT-${donation.id}-${Date.now().toString().slice(-4)}`;
    }

    const result = await donationService.updateDonationStatusTransaction(
      id,
      donation.donorId,
      updateData,
      status
    );

    // Notify Donor of Status Change
    const hospital = await userService.findById(req.user.id);

    let notificationTitle = 'Donation Application Updated';
    let notificationMsg = `Your application status is now ${status}.`;

    if (status === 'SCHEDULED') {
      notificationTitle = '📅 Donation Appointment Scheduled!';
      notificationMsg = `Your donation is scheduled at ${hospital.hospitalProfile.name} for ${new Date(scheduledDate).toLocaleString()}.`;
    } else if (status === 'COMPLETED') {
      notificationTitle = '🎉 Donation Completed! Thank You!';
      notificationMsg = `Congratulations! You successfully donated blood at ${hospital.hospitalProfile.name}. Your certificate is now ready for download.`;
    } else if (status === 'REJECTED') {
      notificationTitle = 'Application Review Complete';
      notificationMsg = `Your donation application to ${hospital.hospitalProfile.name} was not accepted at this time.`;
    }

    await notificationService.createNotification(
      donation.donorId,
      notificationTitle,
      notificationMsg
    );

    res.json(result);
  } catch (error) {
    console.error('Update donation status error:', error);
    res.status(500).json({ error: 'Server error updating status.' });
  }
}

/**
 * Fetch certificate details for a completed donation.
 */
async function getCertificate(req, res) {
  const { id } = req.params;
  try {
    const donation = await donationService.findByIdWithDetails(id);

    if (!donation) return res.status(404).json({ error: 'Donation record not found.' });

    // Verify user owns this certificate, or is the hospital that administered it, or is admin
    if (donation.donorId !== req.user.id && donation.request.hospitalId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access forbidden: You cannot view this certificate.' });
    }

    if (donation.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Donation has not been completed. Certificate is unavailable.' });
    }

    // Load hospital details
    const hosp = await userService.findById(donation.request.hospitalId);

    res.json({
      certificateId: donation.certificateUrl,
      completedAt: donation.completedAt,
      bloodGroup: donation.request.bloodGroup,
      donor: {
        name: donation.donor.donorProfile?.name,
        email: donation.donor.email,
        phone: donation.donor.donorProfile?.phone,
        gender: donation.donor.donorProfile?.gender,
        age: donation.donor.donorProfile?.age
      },
      hospital: {
        name: hosp?.hospitalProfile?.name,
        address: hosp?.hospitalProfile?.address,
        licenseNumber: hosp?.hospitalProfile?.licenseNumber
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error loading certificate.' });
  }
}

export {
  applyDonation,
  getApplicationsByRequest,
  updateDonationStatus,
  getCertificate
};
