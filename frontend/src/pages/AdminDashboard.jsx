import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Award, FileSpreadsheet, Users, Trash2, CheckCircle, RefreshCw, Building2, Search, Check, X, AlertTriangle, ExternalLink, Activity } from 'lucide-react';
import api from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ donorsCount: 0, hospitalsCount: 0, activeRequests: 0, completedDonations: 0 });
  const [pendingHospitals, setPendingHospitals] = useState([]);
  const [allHospitals, setAllHospitals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'VERIFIED' | 'UNVERIFIED'
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadAdminData = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data.stats);
      setPendingHospitals(res.data.pendingHospitals || []);

      const hospRes = await api.get('/admin/hospitals');
      setAllHospitals(hospRes.data || []);
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
        <div className="flex flex-col items-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-bloodred-500 border-t-transparent"></div>
          <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading Admin Portal...</span>
        </div>
      </div>
    );
  }

  // Filtered hospitals list
  const filteredHospitals = allHospitals.filter(hosp => {
    const name = hosp.hospitalProfile?.name?.toLowerCase() || '';
    const license = hosp.hospitalProfile?.licenseNumber?.toLowerCase() || '';
    const email = hosp.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || name.includes(query) || license.includes(query) || email.includes(query);

    if (filterStatus === 'VERIFIED') {
      return matchesQuery && hosp.hospitalProfile?.isVerified;
    }
    if (filterStatus === 'UNVERIFIED') {
      return matchesQuery && !hosp.hospitalProfile?.isVerified;
    }
    return matchesQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 pt-8 pb-24 bg-slate-950 text-left font-sans relative min-h-[85vh]">
      {/* Background glow effects */}
      <div className="absolute top-0 right-10 h-[350px] w-[350px] rounded-full bg-bloodred-900/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 h-[300px] w-[300px] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none"></div>

      {/* Header Profile Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-bloodred-500/20 to-amber-500/20 text-bloodred-400 border border-bloodred-500/30 flex items-center justify-center shadow-inner">
            <Shield className="h-7 w-7 text-bloodred-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl font-black text-white tracking-tight">BloodLink Operations Center</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-bloodred-950/60 border border-bloodred-800/40 text-[10px] font-extrabold text-bloodred-400 uppercase tracking-wider flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-bloodred-400 animate-ping"></span>
                Root Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify medical credentials, oversee live hospital match cycles, and manage system security.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>Cluster Healthy</span>
          </div>

          <button
            onClick={loadAdminData}
            disabled={actionLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-bold flex items-center space-x-2 disabled:opacity-50 shadow-sm"
            title="Refresh All Records"
          >
            <RefreshCw className={`h-4 w-4 ${actionLoading ? 'animate-spin text-bloodred-400' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-bloodred-950/40 border border-bloodred-800/50 text-bloodred-200 text-xs flex items-center space-x-3 shadow-lg">
          <AlertTriangle className="h-4 w-4 text-bloodred-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center space-x-3 shadow-lg">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Enhanced KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Registered Donors</span>
            <div className="h-9 w-9 rounded-xl bg-bloodred-500/10 text-bloodred-500 border border-bloodred-500/20 flex items-center justify-center">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white tracking-tight">{stats.donorsCount}</span>
            <span className="text-[10px] font-bold text-emerald-400">Verified Donors</span>
          </div>
          <div className="mt-3 h-1 w-full bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full bg-bloodred-500 rounded-full w-3/4"></div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Partner Hospitals</span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Building2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white tracking-tight">{stats.hospitalsCount}</span>
            <span className="text-[10px] font-bold text-slate-400">Centers</span>
          </div>
          <div className="mt-3 h-1 w-full bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full w-2/3"></div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Active Requests</span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Activity className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white tracking-tight">{stats.activeRequests}</span>
            <span className="text-[10px] font-bold text-amber-400">Live Broadcast</span>
          </div>
          <div className="mt-3 h-1 w-full bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full w-1/2"></div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Completed Matches</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Award className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white tracking-tight">{stats.completedDonations}</span>
            <span className="text-[10px] font-bold text-emerald-400">Lives Saved</span>
          </div>
          <div className="mt-3 h-1 w-full bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-4/5"></div>
          </div>
        </div>
      </div>

      {/* Main Grid: Pending Approvals & Hospital Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (5 Cols): Pending Approvals Queue */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-400" />
              <span>Pending Verifications</span>
              {pendingHospitals.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-800/40 text-[10px] font-extrabold text-amber-300 animate-pulse">
                  {pendingHospitals.length} new
                </span>
              )}
            </h3>
          </div>

          {pendingHospitals.length === 0 ? (
            <div className="glass-panel p-10 text-center rounded-2xl border border-slate-800">
              <CheckCircle className="mx-auto h-10 w-10 text-emerald-500/60 mb-3" />
              <h4 className="text-xs font-bold text-slate-300">Verification Queue Clear</h4>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                All registered medical facilities have been reviewed and approved.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingHospitals.map(hosp => (
                <div
                  key={hosp.id}
                  className="glass-panel p-5 rounded-2xl border border-amber-900/40 bg-gradient-to-b from-slate-900/60 to-slate-950 text-xs relative overflow-hidden transition-all duration-300 hover:border-amber-700/50 shadow-lg"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-amber-400" />
                        <span>{hosp.name}</span>
                      </h4>
                      <p className="text-[10px] text-amber-300/80 mt-0.5 font-mono">
                        License: <span className="font-bold">{hosp.licenseNumber}</span>
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 text-[9px] font-extrabold uppercase border border-amber-800/40">
                      Awaiting Review
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-300 my-3 p-3 rounded-xl bg-slate-950/80 border border-slate-900">
                    <div className="flex justify-between"><span className="text-slate-500">Contact Email:</span><span className="font-mono text-slate-200">{hosp.email}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Phone:</span><span className="text-slate-200">{hosp.phone || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Facility Address:</span><span className="text-slate-200 truncate max-w-[180px]">{hosp.address || 'N/A'}</span></div>
                  </div>

                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={() => verifyHospital(hosp.id, true)}
                      disabled={actionLoading}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-950/40 transition-colors disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve License</span>
                    </button>
                    <button
                      onClick={() => removeUser(hosp.id)}
                      disabled={actionLoading}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-bloodred-400 border border-slate-800 text-xs font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                      title="Decline license application and remove account"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (7 Cols): Hospital Directory with Live Search */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
              <Building2 className="h-4.5 w-4.5 text-blue-400" />
              <span>Medical Facilities Directory</span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400">
                {filteredHospitals.length} listed
              </span>
            </h3>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setFilterStatus('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  filterStatus === 'ALL' ? 'bg-bloodred-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('VERIFIED')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  filterStatus === 'VERIFIED' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Verified
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('UNVERIFIED')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  filterStatus === 'UNVERIFIED' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Unverified
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by hospital name, license number, or email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-bloodred-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Hospital Directory Table/Cards */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="max-h-[500px] overflow-y-auto scrollbar-thin divide-y divide-slate-850">
              {filteredHospitals.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  <Building2 className="mx-auto h-8 w-8 text-slate-700 mb-2" />
                  <p className="font-bold">No hospitals found matching your filter.</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Try searching for a different keyword or resetting filters.</p>
                </div>
              ) : (
                filteredHospitals.map(hosp => {
                  const isVerified = hosp.hospitalProfile?.isVerified;
                  return (
                    <div
                      key={hosp.id}
                      className="p-4 hover:bg-slate-900/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm text-slate-100">
                            {hosp.hospitalProfile?.name || 'Unnamed Hospital'}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                              isVerified
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                                : 'bg-amber-950/60 text-amber-400 border-amber-800/40'
                            }`}
                          >
                            {isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                          <span className="font-mono text-[10px]">Lic: <b>{hosp.hospitalProfile?.licenseNumber || 'None'}</b></span>
                          <span>•</span>
                          <span className="text-slate-400">{hosp.email}</span>
                          {hosp.hospitalProfile?.address && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500 truncate max-w-[200px]">{hosp.hospitalProfile.address}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {isVerified ? (
                          <button
                            onClick={() => verifyHospital(hosp.id, false)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-[11px] font-bold text-amber-400 border border-amber-900/40 transition-colors disabled:opacity-50"
                            title="Revoke active license verification"
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => verifyHospital(hosp.id, true)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white transition-colors disabled:opacity-50 shadow-sm"
                            title="Approve and verify hospital"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => removeUser(hosp.id)}
                          disabled={actionLoading}
                          className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-500 hover:text-bloodred-400 border border-slate-800 transition-colors disabled:opacity-50"
                          title="Block / Delete Hospital Account"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
