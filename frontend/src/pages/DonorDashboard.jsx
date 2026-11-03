import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Heart, MapPin, CheckCircle, Clock, ToggleLeft, ToggleRight, Award, Eye, Download, Info, Map, Layers, ChevronDown, ChevronUp, Navigation } from 'lucide-react';
import MapView from '../components/MapView';
import api from '../services/api';

const DonorDashboard = () => {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  
  // Tab control
  const [activeTab, setActiveTab] = useState('feed');
  const [showMap, setShowMap] = useState(true);
  const [viewLayout, setViewLayout] = useState('split'); // 'radar' (top radar view) | 'split' (side-by-side with map on left)

  // States
  const [profile, setProfile] = useState(null);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync tab with URL hash from navbar clicks
  useEffect(() => {
    if (location.hash === '#history') {
      setActiveTab('history');
    } else {
      setActiveTab('feed');
    }
  }, [location.hash]);

  const loadData = async () => {
    try {
      setError('');
      // Fetch donor dashboard: profile + matching requests
      const dashRes = await api.get('/users/dashboard');
      setProfile(dashRes.data.donorProfile);
      setNearbyRequests(dashRes.data.nearbyRequests);

      // Fetch history
      const histRes = await api.get('/users/history');
      setHistory(histRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleAvailability = async () => {
    if (!profile) return;
    try {
      const updatedAvail = !profile.availability;
      const res = await api.put('/users/profile', {
        ...profile,
        availability: updatedAvail
      });
      setProfile(res.data);
      setSuccessMsg(`Availability status updated to ${updatedAvail ? 'Available' : 'Unavailable'}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      refreshUser();
    } catch (err) {
      console.error(err);
      setError('Failed to update availability status.');
    }
  };

  const handleApply = async (requestId) => {
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await api.post('/donations/apply', { requestId });
      setSuccessMsg('Application submitted successfully! Hospital has been notified.');
      setTimeout(() => setSuccessMsg(''), 5000);
      // Reload history and dashboard
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit donation application.');
    } finally {
      setActionLoading(false);
    }
  };

  const viewCertificate = async (donationId) => {
    try {
      const res = await api.get(`/donations/certificate/${donationId}`);
      setSelectedCertificate(res.data);
    } catch (err) {
      alert('Error fetching certificate: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-bloodred-500 border-t-transparent"></div>
      </div>
    );
  }

  // Pre-process markers for map: open requests nearby
  const mapMarkers = nearbyRequests.map(r => ({
    name: r.hospitalName,
    latitude: r.hospitalLatitude,
    longitude: r.hospitalLongitude,
    bloodGroup: r.bloodGroup,
    distance: r.distance
  }));

  // Statistics
  const completedDonationsCount = history.filter(h => h.status === 'COMPLETED').length;
  const pendingApplicationsCount = history.filter(h => h.status === 'APPLIED' || h.status === 'SCHEDULED').length;

  return (
    <div className="max-w-7xl mx-auto px-6 pt-8 pb-28 bg-slate-950 text-left font-sans relative min-h-[85vh]">
      {/* Background radial effects */}
      <div className="absolute top-0 right-10 h-[300px] w-[300px] rounded-full bg-bloodred-900/10 blur-[120px] pointer-events-none"></div>

      {/* Global Alerts inside Dashboard */}
      {error && <div className="mb-5 p-3.5 rounded-xl bg-bloodred-900/30 border border-bloodred-800/40 text-bloodred-200 text-xs">{error}</div>}
      {successMsg && <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs">{successMsg}</div>}

      {/* Header Profile Info Panel */}
      {profile && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-2xl bg-bloodred-500/10 text-bloodred-500 border border-bloodred-500/20 font-black text-2xl flex items-center justify-center">
              {profile.bloodGroup}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-xl font-extrabold text-white leading-tight">{profile.name}</h2>
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-850 text-[9px] font-bold text-slate-400">DONOR</span>
              </div>
              <p className="text-xs text-slate-455 mt-1 leading-normal">
                {profile.address || 'Location coordinates saved'} | Age: {profile.age} yrs | Weight: {profile.weight} kg
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6 shrink-0 bg-slate-900/40 border border-slate-850 p-4 rounded-xl">
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Completed</span>
              <span className="text-2xl font-black text-white">{completedDonationsCount}</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-800"></div>
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Pending</span>
              <span className="text-2xl font-black text-white">{pendingApplicationsCount}</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-800"></div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-1">Status</span>
              <button onClick={toggleAvailability} className="focus:outline-none block">
                {profile.availability ? (
                  <span className="flex items-center text-emerald-400 font-bold text-xs space-x-1 hover:text-emerald-300">
                    <ToggleRight className="h-5 w-5" /> <span>Active</span>
                  </span>
                ) : (
                  <span className="flex items-center text-slate-500 font-bold text-xs space-x-1 hover:text-slate-400">
                    <ToggleLeft className="h-5 w-5" /> <span>Busy</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Selector Navigation */}
      

      {/* Render Active View */}
      {activeTab === 'feed' ? (
        <div className="space-y-6">
          {/* Radar & Map Header Controls */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-xl bg-bloodred-500/10 border border-bloodred-500/20 flex items-center justify-center text-bloodred-500">
                <Navigation className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  Live Emergency Radar & Coverage
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {nearbyRequests.length} matching hospital requests within {nearbyRequests[0]?.radius || 10} km
                </p>
              </div>
            </div>

            {/* Layout & Visibility Toggle Buttons */}
            <div className="flex items-center space-x-2">
              {showMap && (
                <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewLayout('radar')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1.5 ${
                      viewLayout === 'radar'
                        ? 'bg-bloodred-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Layers className="h-3 w-3" /> Top Radar
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewLayout('split')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1.5 ${
                      viewLayout === 'split'
                        ? 'bg-bloodred-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Map className="h-3 w-3" /> Split View
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowMap(prev => !prev)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Map className="h-3.5 w-3.5 text-bloodred-400" />
                <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
                {showMap ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Map Section (When in Radar Mode) */}
          {showMap && viewLayout === 'radar' && profile && (
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="rounded-xl overflow-hidden border border-slate-800">
                <MapView
                  latitude={profile.latitude}
                  longitude={profile.longitude}
                  markers={mapMarkers}
                  radius={nearbyRequests[0]?.radius || 10}
                  centerLabel="Your Location"
                />
              </div>

              {/* Integrated Horizontal Legend Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-1 text-xs">
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-bloodred-500 inline-block shadow-sm shadow-bloodred-500/50"></span>
                    <span className="text-slate-300">Active Hospital Requests</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block shadow-sm shadow-blue-500/50"></span>
                    <span className="text-slate-300">Your Registered GPS Pin</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="h-2.5 w-2.5 rounded-full border border-bloodred-400/80 bg-bloodred-500/10 inline-block"></span>
                    <span className="text-slate-300">Coverage Radius ({nearbyRequests[0]?.radius || 10} km)</span>
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">Live geo-spatial tracking</span>
              </div>
            </div>
          )}

          {/* Requests Content Section */}
          {viewLayout === 'split' && showMap && profile ? (
            /* Split View: Map on Left (col-5), Requests on Right (col-7) - ZERO overlap with bottom-right chatbot */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-20">
                <div className="rounded-2xl overflow-hidden border border-slate-800">
                  <MapView
                    latitude={profile.latitude}
                    longitude={profile.longitude}
                    markers={mapMarkers}
                    radius={nearbyRequests[0]?.radius || 10}
                    centerLabel="Your Location"
                  />
                </div>
                <div className="glass-panel p-3.5 rounded-xl border border-slate-850 text-xs space-y-2">
                  <h5 className="font-bold text-slate-200 text-[11px]">Map Legend</h5>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-bloodred-500 inline-block"></span>
                    <span>Hospital Blood Needs</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-blue-500 inline-block"></span>
                    <span>Your GPS Coordinate</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-200 flex items-center">
                    <Heart className="h-5 w-5 text-bloodred-500 mr-2 animate-pulse-heart" /> Emergency Matching Requests
                  </h3>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-850 text-[10px] font-bold text-slate-400">
                    {nearbyRequests.length} matching found
                  </span>
                </div>

                {nearbyRequests.length === 0 ? (
                  <div className="glass-panel p-10 text-center rounded-2xl border border-slate-800">
                    <Info className="mx-auto h-8 w-8 text-slate-600 mb-2.5" />
                    <p className="text-xs font-bold text-slate-400">No active matching blood requests found nearby.</p>
                    <p className="text-[10px] text-slate-500 mt-1">Make sure you are within the radius and your blood group matches.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {nearbyRequests.map(req => {
                      const hasApplied = history.some(item => item.requestId === req.id);
                      return (
                        <div
                          key={req.id}
                          className={`glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden transition-all duration-300 hover:border-slate-700 ${
                            req.aiPriority === 'Critical' ? 'border-l-4 border-l-bloodred-500 shadow-bloodred-950/5' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-black text-slate-200">{req.hospitalName}</span>
                                {req.aiPriority === 'Critical' && (
                                  <span className="px-1.5 py-0.5 rounded bg-bloodred-950 text-bloodred-400 border border-bloodred-900/30 text-[8px] font-bold tracking-wide flex items-center">
                                    <Info className="h-2 w-2 mr-0.5" /> CRITICAL NEED
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-500 flex items-center mt-0.5">
                                <MapPin className="h-2.5 w-2.5 mr-0.5 text-slate-400" /> {req.hospitalAddress} ({req.distance} km away)
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-black text-bloodred-400 block">{req.unitsRequired} Units Required</span>
                              <span className="text-[9px] text-slate-500">Group {req.bloodGroup}</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-350 bg-slate-950/40 p-3 rounded-xl leading-relaxed mb-3 border border-slate-900/60">
                            {req.description}
                          </p>

                          {req.aiReason && (
                            <p className="text-[10px] text-amber-400 bg-amber-950/10 border border-amber-900/20 p-2.5 rounded-xl leading-relaxed mb-4">
                              <b>AI Assessment:</b> {req.aiReason}
                            </p>
                          )}

                          <div className="flex justify-between items-center pt-3 border-t border-slate-900">
                            <span className="text-[10px] text-slate-500">Required before: {new Date(req.requiredBefore).toLocaleDateString()}</span>
                            
                            {hasApplied ? (
                              <button
                                disabled
                                className="px-4 py-1.5 rounded-xl bg-slate-900 text-slate-500 font-bold text-[10px] border border-slate-850 transition-colors cursor-not-allowed"
                              >
                                Applied
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApply(req.id)}
                                disabled={actionLoading || (profile.lastDonationDate && (new Date().getTime() - new Date(profile.lastDonationDate).getTime() < 90 * 24 * 60 * 60 * 1000))}
                                className="px-4 py-1.5 rounded-xl bg-bloodred-500 hover:bg-bloodred-600 text-white font-bold text-[10px] shadow-md shadow-bloodred-500/10 transition-colors disabled:opacity-50"
                              >
                                Apply to Donate
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Radar / Full Grid View: Cards rendered in responsive 2-column grid */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-200 flex items-center">
                  <Heart className="h-5 w-5 text-bloodred-500 mr-2 animate-pulse-heart" /> Emergency Matching Requests
                </h3>
                <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-850 text-[10px] font-bold text-slate-400">
                  {nearbyRequests.length} matching found
                </span>
              </div>

              {nearbyRequests.length === 0 ? (
                <div className="glass-panel p-10 text-center rounded-2xl border border-slate-800">
                  <Info className="mx-auto h-8 w-8 text-slate-600 mb-2.5" />
                  <p className="text-xs font-bold text-slate-400">No active matching blood requests found nearby.</p>
                  <p className="text-[10px] text-slate-500 mt-1">Make sure you are within the radius and your blood group matches.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nearbyRequests.map(req => {
                    const hasApplied = history.some(item => item.requestId === req.id);
                    return (
                      <div
                        key={req.id}
                        className={`glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden transition-all duration-300 hover:border-slate-700 flex flex-col justify-between ${
                          req.aiPriority === 'Critical' ? 'border-l-4 border-l-bloodred-500 shadow-bloodred-950/5' : ''
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-black text-slate-200">{req.hospitalName}</span>
                                {req.aiPriority === 'Critical' && (
                                  <span className="px-1.5 py-0.5 rounded bg-bloodred-950 text-bloodred-400 border border-bloodred-900/30 text-[8px] font-bold tracking-wide flex items-center">
                                    <Info className="h-2 w-2 mr-0.5" /> CRITICAL NEED
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-500 flex items-center mt-0.5">
                                <MapPin className="h-2.5 w-2.5 mr-0.5 text-slate-400" /> {req.hospitalAddress} ({req.distance} km away)
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] font-black text-bloodred-400 block">{req.unitsRequired} Units</span>
                              <span className="text-[9px] text-slate-500 font-bold">Group {req.bloodGroup}</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-350 bg-slate-950/40 p-3 rounded-xl leading-relaxed mb-3 border border-slate-900/60">
                            {req.description}
                          </p>

                          {req.aiReason && (
                            <p className="text-[10px] text-amber-400 bg-amber-950/10 border border-amber-900/20 p-2.5 rounded-xl leading-relaxed mb-4">
                              <b>AI Assessment:</b> {req.aiReason}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-slate-900 mt-2">
                          <span className="text-[10px] text-slate-500">Needed by: {new Date(req.requiredBefore).toLocaleDateString()}</span>
                          
                          {hasApplied ? (
                            <button
                              disabled
                              className="px-4 py-1.5 rounded-xl bg-slate-900 text-slate-500 font-bold text-[10px] border border-slate-850 transition-colors cursor-not-allowed"
                            >
                              Applied
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApply(req.id)}
                              disabled={actionLoading || (profile.lastDonationDate && (new Date().getTime() - new Date(profile.lastDonationDate).getTime() < 90 * 24 * 60 * 60 * 1000))}
                              className="px-4 py-1.5 rounded-xl bg-bloodred-500 hover:bg-bloodred-600 text-white font-bold text-[10px] shadow-md shadow-bloodred-500/10 transition-colors disabled:opacity-50"
                            >
                              Apply to Donate
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* History View Tab */
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-200 flex items-center">
                <Award className="h-5 w-5 text-bloodred-500 mr-2" /> Donation History & Credentials
              </h3>
              <p className="text-xs text-slate-500">Track and download certificates for all your local blood donation workflows</p>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 max-w-4xl mx-auto">
              <Award className="mx-auto h-10 w-10 text-slate-700 mb-3" />
              <p className="text-xs font-bold text-slate-400">No donation applications logged yet.</p>
              <p className="text-[10px] text-slate-500 mt-1">Once you apply and complete a donation request, your logs and digital certificate will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-850 bg-slate-900/10">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-900 border-b border-slate-850 text-[10px] uppercase font-bold text-slate-455">
                  <tr>
                    <th className="px-6 py-4">Hospital Name</th>
                    <th className="px-6 py-4">Blood Group</th>
                    <th className="px-6 py-4">Date Applied</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions / Credentials</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {history.map(item => (
                    <tr key={item.id} className="hover:bg-slate-850/30 transition-colors">
                      <td className="px-6 py-4.5 font-bold text-slate-350">{item.hospitalName}</td>
                      <td className="px-6 py-4 font-black text-bloodred-400">{item.request?.bloodGroup || 'O+'}</td>
                      <td className="px-6 py-4 text-slate-455">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold ${
                          item.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-450 border border-emerald-900/30' :
                          item.status === 'SCHEDULED' ? 'bg-blue-950 text-blue-450 border border-blue-900/30' :
                          item.status === 'REJECTED' ? 'bg-bloodred-950 text-bloodred-450 border border-bloodred-900/30' :
                          'bg-slate-800 text-slate-400 border border-slate-700/50'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.status === 'COMPLETED' && (
                          <button
                            onClick={() => viewCertificate(item.id)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[10px] font-bold flex items-center space-x-1.5 ml-auto border border-amber-500/20 transition-all"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Download Certificate</span>
                          </button>
                        )}
                        {item.status === 'SCHEDULED' && (
                          <span className="text-[10px] text-blue-400 font-bold inline-block px-2 py-1 bg-blue-950/20 border border-blue-900/30 rounded-md">
                            📅 Appt: {new Date(item.scheduledDate).toLocaleDateString()}
                          </span>
                        )}
                        {item.status === 'APPLIED' && (
                          <span className="text-[10px] text-slate-500 block italic">Awaiting hospital scheduling</span>
                        )}
                        {item.status === 'REJECTED' && (
                          <span className="text-[10px] text-slate-500 block">Not selected for request</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Certificate Overlay Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4 py-6 font-sans">
          <div className="glass-panel max-w-2xl w-full p-8 rounded-3xl border border-slate-800 text-center relative overflow-hidden bg-slate-900/90 shadow-2xl">
            {/* Elegant Background Certificate Border */}
            <div className="absolute inset-4 border-2 border-dashed border-amber-600/30 rounded-2xl pointer-events-none"></div>
            
            <button
              onClick={() => setSelectedCertificate(null)}
              className="absolute top-6 right-6 px-2.5 py-1 rounded-lg bg-slate-955 hover:bg-slate-900 border border-slate-800 text-slate-455 hover:text-white text-xs font-bold"
            >
              Close
            </button>

            {/* Certificate Content */}
            <div className="my-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20">
                <Award className="h-8 w-8" />
              </div>
              <h1 className="font-serif text-2xl font-bold text-amber-500 tracking-wide">CERTIFICATE OF BLOOD DONATION</h1>
              <p className="text-[9px] tracking-widest text-slate-400 uppercase mt-1">Granted by BloodLink Platform</p>
              
              <div className="h-[1px] w-28 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto my-6"></div>
              
              <p className="text-xs text-slate-350 italic">This is certified to acknowledge that</p>
              <h2 className="text-xl font-bold text-white mt-2 mb-1">{selectedCertificate.donor.name}</h2>
              <p className="text-[10px] text-slate-400 leading-normal max-w-md mx-auto">
                has voluntarily and selflessly donated <b>{selectedCertificate.bloodGroup}</b> blood to assist emergency medical response.
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto my-8 text-left p-4 rounded-xl bg-slate-950/80 border border-slate-850">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Administered At</span>
                  <span className="text-xs font-bold text-slate-200">{selectedCertificate.hospital.name}</span>
                  <span className="text-[10px] text-slate-455 block mt-0.5">{selectedCertificate.hospital.address}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Date of Donation</span>
                  <span className="text-xs font-bold text-slate-200">{new Date(selectedCertificate.completedAt).toLocaleDateString()}</span>
                  <span className="text-[10px] text-slate-455 block mt-0.5">Time: {new Date(selectedCertificate.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>

              <div className="flex justify-between items-center max-w-md mx-auto text-left text-[9px] text-slate-500">
                <span>Verification ID: <b className="text-slate-400">{selectedCertificate.certificateId}</b></span>
                <span>Hospital Reg License: {selectedCertificate.hospital.licenseNumber}</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="mt-4 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/10 flex items-center space-x-1.5 mx-auto transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Print Certificate</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorDashboard;
