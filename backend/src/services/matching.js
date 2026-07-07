/**
 * Distance matching and AI donor ranking service
 */

/**
 * Calculates the distance between two sets of GPS coordinates using the Haversine formula.
 * Returns distance in kilometers.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return parseFloat(distance.toFixed(2));
}

/**
 * Checks if a donor is medically eligible based on their last donation date.
 * Typically, whole blood donation has a minimum cooling-off period of 90 days.
 */
function isDonorMedicallyEligible(lastDonationDate) {
  if (!lastDonationDate) return true;
  
  const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;
  const lastDonationTime = new Date(lastDonationDate).getTime();
  const currentTime = new Date().getTime();
  
  return (currentTime - lastDonationTime) >= ninetyDaysInMs;
}

/**
 * AI-powered Donor Ranking Algorithm
 * Computes a suitability score (0-100) based on:
 * 1. Distance Proximity (Weight: 40%) - Closer is higher.
 * 2. Availability Status (Weight: 30%) - Available now is higher.
 * 3. History of Successful Donations (Weight: 30%) - Experience is valued.
 */
function rankDonors(donors, hospitalLat, hospitalLon, maxRadiusKm) {
  return donors
    .map(donor => {
      const profile = donor.donorProfile;
      if (!profile) return null;

      // 1. Calculate distance
      const distance = calculateDistance(hospitalLat, hospitalLon, profile.latitude, profile.longitude);
      
      // Calculate individual scores
      // Distance score: linearly degrades from 40 (at 0 km) to 0 (at maxRadiusKm)
      const distanceScore = Math.max(0, 40 * (1 - distance / maxRadiusKm));
      
      // Availability score: 30 points if available, 0 otherwise
      const availabilityScore = profile.availability ? 30 : 0;
      
      // Donation experience score: 10 points per previous successful donation, capped at 30
      const completedDonationCount = donor.donations.filter(d => d.status === 'COMPLETED').length;
      const historyScore = Math.min(30, completedDonationCount * 10);
      
      // Total suitability score
      const suitabilityScore = Math.round(distanceScore + availabilityScore + historyScore);
      
      return {
        id: donor.id,
        name: profile.name,
        email: donor.email,
        phone: profile.phone,
        bloodGroup: profile.bloodGroup,
        latitude: profile.latitude,
        longitude: profile.longitude,
        distance,
        availability: profile.availability,
        completedDonationsCount: completedDonationCount,
        suitabilityScore,
        lastDonationDate: profile.lastDonationDate
      };
    })
    .filter(donor => donor !== null && donor.distance <= maxRadiusKm)
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}

export {
  calculateDistance,
  isDonorMedicallyEligible,
  rankDonors
};
