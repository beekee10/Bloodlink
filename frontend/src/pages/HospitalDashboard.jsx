import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { PlusCircle, Heart, Users, FileSpreadsheet, Calendar, Sparkles, Navigation, CheckCircle, ShieldAlert, Award, Clock, ArrowRight, Info, CreditCard } from 'lucide-react';
import api from '../services/api';

const HospitalDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Tab switcher state
  const [activeTab, setActiveTab] = useState('overview');

  // Sync tab with URL hash from navbar clicks
  useEffect(() => {
    if (location.hash === '#requests') {
      setActiveTab('manage');
    } else if (location.hash === '#subscription') {
      setActiveTab('subscription');
    } else {
      setActiveTab('overview');
    }
  }, [location.hash]);
  
  // States
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ activeRequestsCount: 0, completedDonationsCount: 0, pendingApplicationsCount: 0 });
  const [requests, setRequests] = useState([]);
  
  // Selected request details (including candidate/ranked donors & applications)
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rankedDonors, setRankedDonors] = useState([]);
  const [applications, setApplications] = useState([]);

  // Create Request form fields
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [unitsRequired, setUnitsRequired] = useState(1);
  const [emergencyLevel, setEmergencyLevel] = useState('Normal');
  const [radius, setRadius] = useState(10);
  const [requiredBefore, setRequiredBefore] = useState('');
  const [description, setDescription] = useState('');

  // AI Helper input
  const [aiContext, setAiContext] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);

  // Appt scheduler state
  const [scheduleApptDate, setScheduleApptDate] = useState('');
  const [activeApptId, setActiveApptId] = useState(null);

  // Subscription Billing Cycle selector
  const [billingCycle, setBillingCycle] = useState('monthly');

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadDashboard = async () => {
    try {
      const res = await api.get('/hospitals/dashboard');
      setProfile(res.data.profile);
      setStats(res.data.stats);
      setRequests(res.data.requests);
      
      // Clear detail views on reload unless open
      if (selectedRequest) {
        fetchRequestDetails(selectedRequest.id);
      }
    } catch (err) {
      console.error(err);
      setError('Error loading hospital dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const fetchRequestDetails = async (id) => {
    try {
      setError('');
      // Fetch request ranked donors
      const res = await api.get(`/requests/${id}`);
      setSelectedRequest(res.data.request);
      setRankedDonors(res.data.rankedDonors);

      // Fetch applications
      const appRes = await api.get(`/donations/request/${id}`);
      setApplications(appRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch request matching details.');
    }
  };

  // AI Feature: Smart Request Text Generator using Gemini
  const generateAIRequest = async () => {
    if (!aiContext.trim()) {
      alert('Please specify some basic context details first (e.g. ICU patient, road accident, scheduled surgery).');
      return;
    }
    setAiGenerating(true);
    try {
      const res = await api.post('/requests/ai-suggest', {
        bloodGroup,
        unitsRequired,
        emergencyLevel,
        details: aiContext
      });
      setDescription(res.data.suggestion);
      setAiContext('');
    } catch (err) {
      console.error(err);
      alert('AI generator failed to respond. Using standard layout.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Submit Blood Request (Includes AI Classification Feedback)
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!requiredBefore || !description) {
      setError('Please fill in required before date and details.');
      return;
    }

    setFormLoading(true);
    setError('');
    setSuccess('');
    setAiFeedback(null);

    try {
      const res = await api.post('/requests', {
        bloodGroup,
        unitsRequired,
        emergencyLevel,
        requiredBefore,
        radius,
        description
      });

      setSuccess('Blood request posted and matching donors notified!');
      setAiFeedback(res.data.aiFeedback);
      
      // Reset form
      setUnitsRequired(1);
      setRequiredBefore('');
      setDescription('');
      
      // Reload stats
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post blood request.');
    } finally {
      setFormLoading(false);
    }
  };

  // Razorpay payment integration
  const razorpayPayment = async(plan, billingCycle) => {
    
    try{
      // create order
      const res = await api.post('/hospitals/payment-razorpay', {plan,billingCycle});
      const {order} = res.data;

      if(order){
        console.log(import.meta.env.VITE_RAZORPAY_KEY_ID);
        console.log(order);
      }
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "BloodLink",
        description: `${plan} Subscription`,
        order_id: order.id,
        handler: async function (response){
          const verifyResponse = await api.post('/hospitals/verify-razorpay', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan,
            billingCycle

          });
          
          if (verifyResponse.data.success) {
            alert("Subscription Activated!");
            window.location.reload();
          }
        }
      }

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    }catch{

    }

  }

  // Application Actions (Schedule / Confirm / Reject)
  const updateApplication = async (appId, status, extraBody = {}) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.put(`/donations/${appId}`, {
        status,
        ...extraBody
      });
      setSuccess(`Donation application marked as ${status}.`);
      setTimeout(() => setSuccess(''), 4000);
      
      // Refresh current details
      if (selectedRequest) {
        fetchRequestDetails(selectedRequest.id);
      }
      loadDashboard();
      setActiveApptId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

 
    if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-bloodred-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 bg-slate-950 text-left font-sans relative min-h-[85vh]">
      <div className="absolute top-0 left-10 h-[300px] w-[300px] rounded-full bg-bloodred-900/10 blur-[120px] pointer-events-none"></div>

      {/* Account Verification Check banner */}
      {profile && !profile.isVerified && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-950/30 border border-amber-900/40 text-amber-300 text-xs flex items-center space-x-2.5">
          <ShieldAlert className="h-5 w-5 shrink-0 animate-pulse text-amber-500" />
          <div>
            <h4 className="font-extrabold">Account Awaiting Verification</h4>
            <p className="mt-0.5 text-slate-400">Our administrative team is validating your license (License: {profile.licenseNumber}). You cannot post active blood requests yet. Please use the seeded account for testing all features.</p>
          </div>
        </div>
      )}

      {/* Trial Expiry banner */}
      {profile && profile.subscriptionStatus === 'TRIAL' && (
        <div className="mb-6 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex justify-between items-center">
          <span className="flex items-center"><Clock className="h-4 w-4 text-bloodred-400 mr-1.5 shrink-0" /> Free Trial Active: 14 days of access granted. Ends on {new Date(profile.trialEndsAt).toLocaleDateString()}.</span>
          <span className="text-[10px] uppercase font-bold text-bloodred-500 tracking-wider bg-bloodred-950/20 px-2 py-0.5 border border-bloodred-900/30 rounded">Trial User</span>
        </div>
      )}

      {/* Active Membership banner */}
      {profile && profile.subscriptionStatus === 'ACTIVE' && (
        <div className="mb-6 p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-900/30 text-xs text-emerald-300 flex justify-between items-center">
          <span className="flex items-center"><CheckCircle className="h-4 w-4 text-emerald-450 mr-1.5 shrink-0" /> Your Premium Membership is active until {new Date(profile.subscriptionEndsAt).toLocaleDateString()}. Thank you for saving lives!</span>
          <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider bg-emerald-950/40 px-2 py-0.5 border border-emerald-800/40 rounded">Active Pro</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-5 rounded-2xl border border-slate-850 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Active Blood Requests</span>
            <h2 className="text-3xl font-extrabold text-white mt-1">{stats.activeRequestsCount}</h2>
          </div>
          <div className="h-10 w-10 rounded-xl bg-bloodred-900/20 text-bloodred-500 flex items-center justify-center">
            <Heart className="h-5 w-5 fill-current" />
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-850 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Applications Pending</span>
            <h2 className="text-3xl font-extrabold text-white mt-1">{stats.pendingApplicationsCount}</h2>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-900/20 text-blue-500 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-850 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Completed Donations</span>
            <h2 className="text-3xl font-extrabold text-white mt-1">{stats.completedDonationsCount}</h2>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-900/20 text-emerald-500 flex items-center justify-center">
            <Award className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex border-b border-slate-800 mb-8 space-x-8">
        <button
          onClick={() => {
            setActiveTab('overview');
            window.location.hash = '';
          }}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'overview' ? 'text-bloodred-500 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Create Request & Analytics
          {activeTab === 'overview' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-bloodred-500 rounded-full"></span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('manage');
            window.location.hash = '#requests';
          }}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'manage' ? 'text-bloodred-500 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Manage Outgoing Requests
          {activeTab === 'manage' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-bloodred-500 rounded-full"></span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('subscription');
            window.location.hash = '#subscription';
          }}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'subscription' ? 'text-bloodred-500 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Subscription Plan
          {activeTab === 'subscription' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-bloodred-500 rounded-full"></span>
          )}
        </button>
      </div>

      {/* Error and Success Notifications */}
      {error && <div className="mb-6 p-3.5 rounded-xl bg-bloodred-900/30 border border-bloodred-800/40 text-bloodred-200 text-xs max-w-5xl">{error}</div>}
      {success && <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs max-w-5xl">{success}</div>}

      {/* Render Active View */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Request Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <h3 className="text-base font-bold text-slate-200 flex items-center mb-5"><PlusCircle className="h-5 w-5 text-bloodred-500 mr-2" /> Publish Emergency Blood Request</h3>

              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Units Needed</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={unitsRequired}
                      onChange={(e) => setUnitsRequired(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Urgency Level</label>
                    <select
                      value={emergencyLevel}
                      onChange={(e) => setEmergencyLevel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none"
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Search Radius (km)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={radius}
                      onChange={(e) => setRadius(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-550 mb-1.5">Needed Before (Date/Time)</label>
                  <input
                    type="datetime-local"
                    required
                    value={requiredBefore}
                    onChange={(e) => setRequiredBefore(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-550 mb-1.5">Request Details / Diagnosis appeal *</label>
                  <textarea
                    rows="4"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write clear appeal. Include room number, details, or patient diagnosis."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formLoading || !profile?.isVerified}
                  className="w-full py-2.5 rounded-xl bg-bloodred-500 hover:bg-bloodred-600 text-white font-bold text-xs shadow-lg shadow-bloodred-500/10 transition-colors disabled:opacity-50"
                >
                  {formLoading ? 'Publishing & Matching...' : 'Publish Request'}
                </button>
              </form>
            </div>
          </div>

          {/* AI Generator on the right column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-5 rounded-2xl border border-slate-850 space-y-4">
              <h4 className="font-extrabold text-xs text-slate-200 flex items-center"><Sparkles className="h-4 w-4 mr-1.5 text-amber-500" /> AI Request Text Generator</h4>
              <p className="text-[10px] text-slate-500 leading-normal">Describe details about the patient or surgery. Our Gemini AI models will write a medical appeal to attract matching donors.</p>
              
              <textarea
                rows="3"
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                placeholder="Example: Road accident, surgery scheduled tomorrow at 9 AM, O- blood needed urgently..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs rounded-xl text-white placeholder:text-slate-550 focus:outline-none"
              />

              <button
                type="button"
                onClick={generateAIRequest}
                disabled={aiGenerating}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-[10px] shadow-md shadow-amber-500/10 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3 fill-current" />
                <span>{aiGenerating ? 'AI Writing...' : 'Generate AI Appeal'}</span>
              </button>
            </div>

            {aiFeedback && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <h4 className="font-extrabold text-white flex items-center"><Sparkles className="h-4 w-4 mr-1 text-bloodred-400" /> AI Priority Detection Analysis</h4>
                <div className="flex space-x-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    aiFeedback.priority === 'Critical' ? 'bg-bloodred-900/40 text-bloodred-300' : 'bg-slate-800 text-slate-300'
                  }`}>{aiFeedback.priority} urgency</span>
                  <span className="text-[10px] text-slate-400">Score: <b>{aiFeedback.score}/100</b></span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal italic">Reasoning: "{aiFeedback.reason}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Requests list on the left column */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center"><FileSpreadsheet className="h-5 w-5 text-bloodred-500 mr-2" /> Outgoing Requests</h3>
            
            {requests.length === 0 ? (
              <div className="glass-panel p-6 text-center rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-400">You haven't posted any blood requests yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {requests.map(req => (
                  <div
                    key={req.id}
                    onClick={() => fetchRequestDetails(req.id)}
                    className={`glass-panel p-4 rounded-xl border border-slate-850 cursor-pointer transition-all hover:border-slate-700 text-left flex justify-between items-center ${
                      selectedRequest?.id === req.id ? 'ring-1 ring-bloodred-500 bg-slate-900/50' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-extrabold text-slate-200">{req.bloodGroup} Request ({req.unitsRequired} Units)</span>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                          req.status === 'OPEN' ? 'bg-emerald-950 text-emerald-450 border border-emerald-900/30' : 'bg-slate-800 text-slate-400'
                        }`}>{req.status}</span>
                      </div>
                      <p className="text-[10px] text-slate-550 mt-1">Needed Before: {new Date(req.requiredBefore).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[9px] font-semibold text-slate-400">
                        {req._count?.applications || 0} Apps
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details workflows panel on the right column */}
          <div className="lg:col-span-2">
            {selectedRequest ? (
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 pt-5">
                <div className="flex justify-between items-start border-b border-slate-850 pb-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-200">Matching Directory: {selectedRequest.bloodGroup} blood</h3>
                    <p className="text-[10px] text-slate-500">Managing applicants & coordinates for request ID #{selectedRequest.id}</p>
                  </div>
                  <button
                    onClick={() => updateApplication(selectedRequest.id, 'CANCELLED')} // Close request
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-500 text-[10px] hover:text-bloodred-400 border border-slate-850 transition-colors"
                  >
                    Close Request
                  </button>
                </div>

                {/* AI Suitability Ranking Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-350 flex items-center">
                      <Sparkles className="h-4 w-4 text-amber-500 mr-1.5" /> AI Donor Suitability Matching
                    </h4>
                  </div>

                  {rankedDonors.length === 0 ? (
                    <p className="text-[10px] text-slate-550 italic py-2">No qualified matching donors found in the radius.</p>
                  ) : (
                    <div className="space-y-2">
                      {rankedDonors.map((donor, idx) => (
                        <div key={donor.id} className="p-3 rounded-xl bg-slate-950 border border-slate-900 flex justify-between items-center text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-500 font-bold">{idx + 1}.</span>
                            <div>
                              <span className="font-bold text-slate-355">{donor.name}</span>
                              <div className="flex items-center space-x-2 text-[9px] text-slate-500 mt-0.5">
                                <span>Distance: <b>{donor.distance} km</b></span>
                                <span>•</span>
                                <span>Completed: <b>{donor.completedDonationsCount}</b></span>
                                <span>•</span>
                                <span>Status: <b className={donor.availability ? 'text-emerald-455' : 'text-slate-500'}>{donor.availability ? 'Available' : 'Busy'}</b></span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-900/30 text-[9px] font-extrabold">
                              {donor.suitabilityScore}% Suitability
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Applicant Review list */}
                <div className="space-y-3 pt-5 border-t border-slate-900 text-left">
                  <h4 className="text-xs font-bold text-slate-350 flex items-center">
                    <Calendar className="h-4 w-4 text-blue-500 mr-1.5" /> Active Applicant Workflows
                  </h4>

                  {applications.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic bg-slate-950/45 p-4 rounded-xl text-center">Awaiting donor signups for this request.</p>
                  ) : (
                    <div className="space-y-3">
                      {applications.map(app => (
                        <div key={app.id} className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-xs">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-bold text-slate-300">{app.donor.name} ({app.donor.bloodGroup})</h5>
                              <span className="text-[9px] text-slate-550">Contact: {app.donor.phone} | Age: {app.donor.age} yrs | Weight: {app.donor.weight} kg</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              app.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400' :
                              app.status === 'SCHEDULED' ? 'bg-blue-950 text-blue-400' :
                              app.status === 'REJECTED' ? 'bg-bloodred-950 text-bloodred-400' :
                              'bg-slate-800 text-slate-355'
                            }`}>{app.status}</span>
                          </div>

                          {app.status === 'APPLIED' && (
                            <div className="flex space-x-2 pt-2 border-t border-slate-900">
                              {activeApptId === app.id ? (
                                <div className="w-full flex items-end space-x-2">
                                  <div className="flex-1">
                                    <span className="text-[9px] text-slate-500 block mb-1">Pick Appointment Date</span>
                                    <input
                                      type="datetime-local"
                                      value={scheduleApptDate}
                                      onChange={(e) => setScheduleApptDate(e.target.value)}
                                      className="w-full px-2 py-1 bg-slate-900 border border-slate-800 text-[10px] rounded text-white focus:outline-none"
                                    />
                                  </div>
                                  <button
                                    onClick={() => updateApplication(app.id, 'SCHEDULED', { scheduledDate: scheduleApptDate })}
                                    disabled={actionLoading}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold"
                                  >
                                    Save Date
                                  </button>
                                  <button
                                    onClick={() => setActiveApptId(null)}
                                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg text-[10px]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setActiveApptId(app.id);
                                      setScheduleApptDate('');
                                    }}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[10px]"
                                  >
                                    Schedule Appointment
                                  </button>
                                  <button
                                    onClick={() => updateApplication(app.id, 'REJECTED')}
                                    disabled={actionLoading}
                                    className="px-3 py-1 bg-slate-900 hover:bg-slate-855 text-slate-450 rounded text-[10px]"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {app.status === 'SCHEDULED' && (
                            <div className="pt-2.5 border-t border-slate-900 flex justify-between items-center text-[10px]">
                              <span className="text-slate-400">📅 Scheduled: <b>{new Date(app.scheduledDate).toLocaleString()}</b></span>
                              <button
                                onClick={() => updateApplication(app.id, 'COMPLETED')}
                                disabled={actionLoading}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] flex items-center space-x-1"
                              >
                                <CheckCircle className="h-3 w-3" />
                                <span>Confirm Completed Donation</span>
                              </button>
                            </div>
                          )}

                          {app.status === 'COMPLETED' && (
                            <div className="pt-2 border-t border-slate-900 text-[10px] text-emerald-400 flex items-center">
                              <Award className="h-3.5 w-3.5 mr-1" /> Donation successfully recorded. Life-saving certificate generated & issued to donor.
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 h-full flex flex-col items-center justify-center">
                <Info className="h-10 w-10 text-slate-700 mb-3" />
                <h4 className="text-xs font-bold text-slate-400">No Request Selected</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-sm">Please select an outgoing request from the list on the left to manage candidate workflows and review applicants.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="space-y-8 animate-fade-in text-left">
          {/* Subscription State Overview Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-bloodred-500/10 text-bloodred-500 border border-bloodred-500/20 flex items-center justify-center">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Membership Plan Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Current Status:{' '}
                  <span className={`font-bold ${profile?.subscriptionStatus === 'ACTIVE' ? 'text-emerald-450' : 'text-amber-500'}`}>
                    {profile?.subscriptionStatus || 'TRIAL'}
                  </span>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-550 tracking-wider block">Validity Expiry</span>
              <span className="text-xs font-extrabold text-slate-300">
                {profile?.subscriptionStatus === 'ACTIVE'
                  ? new Date(profile?.subscriptionEndsAt).toLocaleDateString()
                  : new Date(profile?.trialEndsAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Pricing Toggle Selector */}
          <div className="text-center space-y-4">
            <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  billingCycle === 'monthly' ? 'bg-bloodred-500 text-white' : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  billingCycle === 'yearly' ? 'bg-bloodred-500 text-white' : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                Yearly Billing (Save more)
              </button>
            </div>
          </div>

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter Plan */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-850 hover:border-slate-800 flex flex-col justify-between relative overflow-hidden transition-all duration-300">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Starter Plan</span>
                <div className="flex items-baseline mt-2 mb-4">
                  <span className="text-3xl font-black text-white">₹{billingCycle === 'yearly' ? '399' : '49'}</span>
                  <span className="text-xs text-slate-550 ml-1">/ {billingCycle === 'yearly' ? 'year' : 'month'}</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">
                  Best for local clinics needing basic request matching within 10 km, coordinate logging, and emergency listing.
                </p>
                <div className="h-[1px] bg-slate-900 mb-6"></div>
                <ul className="space-y-2 text-[10px] text-slate-500 mb-8">
                  <li className="flex items-center"><CheckCircle className="h-3.5 w-3.5 text-emerald-450 mr-2 shrink-0" /> Max 10 active requests</li>
                  <li className="flex items-center"><CheckCircle className="h-3.5 w-3.5 text-emerald-450 mr-2 shrink-0" /> Local GPS matching</li>
                  <li className="flex items-center"><CheckCircle className="h-3.5 w-3.5 text-emerald-450 mr-2 shrink-0" /> Standard response workflows</li>
                </ul>
              </div>
              <button
                onClick={() => razorpayPayment('STARTER',billingCycle)}
                disabled={actionLoading}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold rounded-xl text-xs transition-colors"
              >
                {actionLoading ? 'Loading SDK...' : 'Pay Online'}
              </button>
            </div>

            {/* Professional Plan (Highly Recommended) */}
            <div className="glass-panel p-6 rounded-2xl border border-bloodred-500/30 hover:border-bloodred-500/50 flex flex-col justify-between relative overflow-hidden bg-slate-900/30 transition-all duration-300">
              <span className="absolute top-3.5 right-3.5 px-2 py-0.5 rounded bg-bloodred-950 border border-bloodred-900/30 text-[8px] font-black text-bloodred-400 tracking-wider">
                RECOMMENDED
              </span>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Professional Plan</span>
                <div className="flex items-baseline mt-2 mb-4">
                  <span className="text-3xl font-black text-white">₹{billingCycle === 'yearly' ? '799' : '99'}</span>
                  <span className="text-xs text-slate-550 ml-1">/ {billingCycle === 'yearly' ? 'year' : 'month'}</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">
                  Perfect for busy regional hospitals. Unlocks AI priority assessments, matched donor ranking, and unlimited requests.
                </p>
                <div className="h-[1px] bg-slate-900 mb-6"></div>
                <ul className="space-y-2 text-[10px] text-slate-500 mb-8">
                  <li className="flex items-center"><CheckCircle className="h-3.5 w-3.5 text-emerald-450 mr-2 shrink-0" /> Unlimited active requests</li>
                  <li className="flex items-center"><CheckCircle className="h-3.5 w-3.5 text-emerald-450 mr-2 shrink-0" /> AI Priority Assessment score</li>
                  <li className="flex items-center"><CheckCircle className="h-3.5 w-3.5 text-emerald-450 mr-2 shrink-0" /> AI Ranked donor suitability list</li>
                </ul>
              </div>
              <button
                onClick={() => razorpayPayment('PROFESSIONAL',billingCycle)}
                disabled={actionLoading}
                className="w-full py-2 bg-bloodred-500 hover:bg-bloodred-600 text-white font-bold rounded-xl text-xs shadow-md shadow-bloodred-500/10 transition-colors"
              >
                {actionLoading ? 'Loading SDK...' : 'Pay Online'}
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-850 hover:border-slate-800 flex flex-col justify-between relative overflow-hidden transition-all duration-300">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Enterprise Plan</span>
                <div className="flex items-baseline mt-2 mb-4">
                  <span className="text-3xl font-black text-white">₹{billingCycle === 'yearly' ? '1999' : '249'}</span>
                  <span className="text-xs text-slate-550 ml-1">/ {billingCycle === 'yearly' ? 'year' : 'month'}</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">
                  Designed for multi-specialty healthcare networks. Advanced multi-center target matches, premium templates, and priority support.
                </p>
                <div className="h-[1px] bg-slate-900 mb-6"></div>
                <ul className="space-y-2 text-[10px] text-slate-500 mb-8">
                  <li className="flex items-center"><CheckCircle className="h-3.5 w-3.5 text-emerald-450 mr-2 shrink-0" /> Everything in Professional</li>
                  <li className="flex items-center"><CheckCircle className="h-3.5 w-3.5 text-emerald-450 mr-2 shrink-0" /> Multi-center match casting</li>
                  <li className="flex items-center"><CheckCircle className="h-3.5 w-3.5 text-emerald-450 mr-2 shrink-0" /> 24/7 Premium technical helpdesk</li>
                </ul>
              </div>
              <button
                onClick={() => razorpayPayment('ENTERPRISE',billingCycle)}
                disabled={actionLoading}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold rounded-xl text-xs transition-colors"
              >
                {actionLoading ? 'Loading SDK...' : 'Pay Online'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDashboard;
