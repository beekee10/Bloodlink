import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Award, FileSpreadsheet, Users, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ donorsCount: 0, hospitalsCount: 0, activeRequests: 0, completedDonations: 0 });
  const [pendingHospitals, setPendingHospitals] = useState([]);
  const [allHospitals, setAllHospitals] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadAdminData = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data.stats);
      setPendingHospitals(res.data.pendingHospitals);

      const hospRes = await api.get('/admin/hospitals');
      setAllHospitals(hospRes.data);
    } catch (err) {
      console.error(err);
      setError('Error loading administration metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const verifyHospital = async (userId, approve) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.put(`/admin/hospitals/${userId}/verify`, { verify: approve });
      setSuccess(approve ? 'Hospital verified and approved successfully!' : 'Hospital verification removed.');
      setTimeout(() => setSuccess(''), 4500);
      loadAdminData();
    } catch (err) {
      setError('Failed to update hospital status: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const removeUser = async (userId) => {
    if (!confirm('Are you sure you want to block and completely remove this account? This action cannot be undone.')) {
      return;
    }
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/users/${userId}`);
      setSuccess('Account removed from database successfully.');
      setTimeout(() => setSuccess(''), 4500);
      loadAdminData();
    } catch (err) {
      setError('Failed to remove user account: ' + (err.response?.data?.error || err.message));
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
    <div className="max-w-7xl mx-auto px-6 py-8 bg-slate-950 text-left font-sans relative">
      <div className="absolute top-0 right-10 h-[300px] w-[300px] rounded-full bg-bloodred-900/10 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-900">
        <div>
          <h2 className="text-xl font-black text-white flex items-center">
            <Shield className="h-5.5 w-5.5 text-bloodred-500 mr-2" /> BloodLink Admin Operations
          </h2>
          <p className="text-xs text-slate-455">Monitor registrations, verify license compliance, and block fake accounts</p>
        </div>
        <button
          onClick={loadAdminData}
          disabled={actionLoading}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${actionLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <div className="mb-6 p-3.5 rounded-xl bg-bloodred-900/30 border border-bloodred-800/40 text-bloodred-200 text-xs">{error}</div>}
      {success && <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs">{success}</div>}

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-5 rounded-2xl border border-slate-850">
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Total Donors Registered</span>
          <h3 className="text-2xl font-black text-white mt-1.5 flex items-center justify-between">
            <span>{stats.donorsCount}</span>
            <Users className="h-5 w-5 text-bloodred-500" />
          </h3>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-850">
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Total Partner Hospitals</span>
          <h3 className="text-2xl font-black text-white mt-1.5 flex items-center justify-between">
            <span>{stats.hospitalsCount}</span>
            <Shield className="h-5 w-5 text-blue-500" />
          </h3>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-850">
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Active Requests Feed</span>
          <h3 className="text-2xl font-black text-white mt-1.5 flex items-center justify-between">
            <span>{stats.activeRequests}</span>
            <FileSpreadsheet className="h-5 w-5 text-amber-500" />
          </h3>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-850">
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Completed Match Cycles</span>
          <h3 className="text-2xl font-black text-white mt-1.5 flex items-center justify-between">
            <span>{stats.completedDonations}</span>
            <Award className="h-5 w-5 text-emerald-500" />
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pending approvals section */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-200 flex items-center">
            <ShieldAlert className="h-5 w-5 text-amber-500 mr-2 animate-bounce" /> Awaiting Verification approvals
          </h3>

          {pendingHospitals.length === 0 ? (
            <div className="glass-panel p-8 text-center rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-400">All registered hospitals are verified! No pending approval requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingHospitals.map(hosp => (
                <div key={hosp.id} className="glass-panel p-5 rounded-2xl border border-slate-800 text-xs">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-200">{hosp.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">License: <b>{hosp.licenseNumber}</b></p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 text-[9px] font-bold uppercase border border-amber-900/30">Pending</span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-350 my-3.5 p-3.5 rounded-xl bg-slate-900 border border-slate-850">
                    <div className="flex justify-between"><span>Email</span><span>{hosp.email}</span></div>
                    <div className="flex justify-between"><span>Phone</span><span>{hosp.phone || 'N/A'}</span></div>
                    <div className="flex justify-between"><span>Location Address</span><span>{hosp.address || 'N/A'}</span></div>
                  </div>

                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={() => verifyHospital(hosp.id, true)}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center space-x-1 border border-emerald-500/20 transition-colors"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Approve License</span>
                    </button>
                    <button
                      onClick={() => removeUser(hosp.id)}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 text-[10px] flex items-center space-x-1 border border-slate-800 hover:text-bloodred-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Decline & Block</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* General directories check */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-200 flex items-center">
            <Shield className="h-5 w-5 text-blue-500 mr-2" /> Registered Hospitals directory
          </h3>

          <div className="glass-panel rounded-2xl border border-slate-850 overflow-hidden">
            <div className="max-h-[380px] overflow-y-auto scrollbar-thin">
              {allHospitals.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No hospitals found.</p>
              ) : (
                <div className="divide-y divide-slate-850">
                  {allHospitals.map(hosp => (
                    <div key={hosp.id} className="p-4 hover:bg-slate-900/30 transition-colors flex justify-between items-center text-xs">
                      <div>
                        <h4 className="font-bold text-slate-200">{hosp.hospitalProfile?.name}</h4>
                        <div className="flex items-center space-x-2 text-[9px] text-slate-455 mt-0.5">
                          <span>License: {hosp.hospitalProfile?.licenseNumber}</span>
                          <span>•</span>
                          <span className={hosp.hospitalProfile?.isVerified ? 'text-emerald-450 font-bold' : 'text-amber-500'}>
                            {hosp.hospitalProfile?.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {hosp.hospitalProfile?.isVerified ? (
                          <button
                            onClick={() => verifyHospital(hosp.id, false)}
                            disabled={actionLoading}
                            className="px-2 py-1 rounded bg-slate-850 hover:bg-slate-800 text-[9px] text-amber-550 border border-slate-750"
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => verifyHospital(hosp.id, true)}
                            disabled={actionLoading}
                            className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-[9px] text-emerald-400 border border-emerald-900/30"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => removeUser(hosp.id)}
                          disabled={actionLoading}
                          className="p-1.5 rounded bg-slate-950 hover:bg-slate-900 text-slate-500 hover:text-bloodred-400 border border-slate-850"
                          title="Block/Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
