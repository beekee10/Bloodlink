import mongoose from 'mongoose';
import { HospitalProfile } from '../models/mongooseModels.js';
import * as userService from '../services/userService.js';
import * as bloodRequestService from '../services/bloodRequestService.js';
import * as donationService from '../services/donationService.js';
import razorpay from '../services/razorpay.js';
import crypto from 'crypto';


/**
 * Get hospital profile.
 */
async function getProfile(req, res) {
  try {
    const profile = await userService.findHospitalProfileByUserId(req.user.id);
    if (!profile) return res.status(404).json({ error: 'Hospital profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Server error loading profile' });
  }
}

/**
 * Update hospital profile.
 */
async function updateProfile(req, res) {
  try {
    const updatedProfile = await userService.updateHospitalProfile(req.user.id, req.body);
    res.json(updatedProfile);
  } catch (error) {
    console.error('Update hospital profile error:', error);
    res.status(500).json({ error: 'Failed to update hospital profile' });
  }
}

/**
 * Get hospital dashboard statistics and analytics.
 */
async function getDashboard(req, res) {
  try {
    const profile = await userService.findHospitalProfileByUserId(req.user.id);

    if (!profile) {
      return res.status(404).json({ error: 'Hospital profile not found' });
    }

    // Count statistics
    const activeRequestsCount = await bloodRequestService.countByHospitalIdAndStatus(req.user.id, 'OPEN');
    const completedDonationsCount = await donationService.countCompletedByHospitalId(req.user.id);
    const pendingApplicationsCount = await donationService.countPendingByHospitalId(req.user.id);

    // List hospital's own requests
    const ownRequests = await bloodRequestService.findManyByHospitalId(req.user.id);

    res.json({
      profile,
      stats: {
        activeRequestsCount,
        completedDonationsCount,
        pendingApplicationsCount
      },
      requests: ownRequests
    });

  } catch (error) {
    console.error('Hospital dashboard statistics loading error:', error);
    res.status(500).json({ error: 'Server error loading analytics' });
  }
}

/**
 * API to make payment of subscription using Razorpay.
 */


async function paymentRazorpay(req, res) {
  try {
    const { plan, billingCycle } = req.body; // plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE', billingCycle: 'monthly' | 'yearly'

    if (!plan || !billingCycle) {
      return res.json({ success: false, message: 'Plan and billing cycle are required' });
    }

    // Price definitions (INR)
    const prices = {
        STARTER: {
            MONTHLY: 4900,
            YEARLY: 49900
        },
        PROFESSIONAL: {
            MONTHLY: 9900,
            YEARLY: 99900
        },
        ENTERPRISE: {
            MONTHLY: 19900,
            YEARLY: 129900
        }
      };

    const amount = prices?.[plan]?.[billingCycle];

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan or billing cycle"
      });
    }

    // Options for Razorpay payment creation
    const options = {
      amount,
      currency: 'INR',
      reciept: `${Date.now()}`
    };

    // Create the order on Razorpay
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });

  } catch (error) {
    console.error('Razorpay subscription order creation failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * API to verify subscription payment from Razorpay hook.
 */
async function verifyRazorpay(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // Fetch order information directly from Razorpay
    const body =razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

      if(expectedSignature !== razorpay_signature){
        return res.status(400).json({ success: false, message: 'Invalid signature' });
      }
      // Update hospital subscription here
      
      return res.status(200).json({
            success: true,
            message: "Payment verified successfully"
        });

  } catch (error) {
    console.error('Razorpay verify error:', error);
    res.json({ success: false, message: error.message });
  }
}

export {
  getProfile,
  updateProfile,
  getDashboard,
  paymentRazorpay,
  verifyRazorpay
};
