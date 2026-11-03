import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, Heart, ShieldAlert, Award, FileSpreadsheet, Activity, CreditCard } from 'lucide-react';
import api from '../services/api';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  // Sync hash state with location or hashchange events
  useEffect(() => {
    setCurrentHash(location.hash);
  }, [location.hash]);

  useEffect(() => {
    const onHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const isLinkActive = (path, hash = '') => {
    if (location.pathname !== path) return false;
    if (!hash) {
      return !currentHash || currentHash === '#' || currentHash === '#feed' || currentHash === '#overview';
    }
    return currentHash === hash;
  };

  const NavLinkItem = ({ to, path, hash = '', icon: Icon, label }) => {
    const active = isLinkActive(path, hash);
    return (
      <Link
        to={to}
        className={`relative px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center space-x-2 text-xs sm:text-sm font-semibold ${
          active
            ? 'text-bloodred-400 bg-bloodred-500/10 border border-bloodred-500/30 shadow-sm shadow-bloodred-500/20'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
        }`}
      >
        <Icon className={`h-4 w-4 transition-colors ${active ? 'text-bloodred-500' : 'text-slate-400'}`} />
        <span>{label}</span>
        {active && (
          <span className="absolute -bottom-1 left-3 right-3 h-0.5 bg-bloodred-500 rounded-full shadow-glow"></span>
        )}
      </Link>
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/users/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 20 seconds for emergency matching simulation
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/users/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  return (
    <nav className="glass-panel sticky top-0 z-40 w-full px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
      {/* Brand Logo */}
      <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => window.location.href = '/'}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bloodred-500 text-white shadow-md shadow-bloodred-500/20">
          <Heart className="h-5.5 w-5.5 fill-current animate-pulse-heart" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-bloodred-500 via-rose-400 to-white bg-clip-text text-transparent">BloodLink</h1>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block -mt-1 font-semibold">AI Emergency Matching</span>
        </div>
      </div>

      {/* Center Nav Link Indicators */}
      {user && (
        <div className="hidden md:flex items-center space-x-2 text-sm">
          {user.role === 'DONOR' && (
            <>
              <NavLinkItem to="/donor" path="/donor" hash="" icon={Activity} label="Donor Feed" />
              <NavLinkItem to="/donor#history" path="/donor" hash="#history" icon={Award} label="Donations" />
            </>
          )}
          {user.role === 'HOSPITAL' && (
            <>
              <NavLinkItem to="/hospital" path="/hospital" hash="" icon={Activity} label="Hospital Dashboard" />
              <NavLinkItem to="/hospital#requests" path="/hospital" hash="#requests" icon={FileSpreadsheet} label="Manage Requests" />
              <NavLinkItem to="/hospital#subscription" path="/hospital" hash="#subscription" icon={CreditCard} label="Subscription Plan" />
            </>
          )}
          {user.role === 'ADMIN' && (
            <NavLinkItem to="/admin" path="/admin" hash="" icon={ShieldAlert} label="Admin Panel" />
          )}
        </div>
      )}

      {/* User Actions */}
      {user ? (
        <div className="flex items-center space-x-4">
          {/* Notifications Center */}
          <div className="relative">
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-bloodred-500 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-bloodred-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotif && (
              <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-2 z-50">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-slate-200">Alerts & Notifications</h4>
                  <button
                    onClick={() => {
                      setNotifications([]);
                      setShowNotif(false);
                    }}
                    className="text-[10px] text-slate-500 hover:text-slate-300"
                  >
                    Clear view
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 py-1.5 scrollbar-thin">
                  {notifications.length === 0 ? (
                    <p className="text-[11px] text-slate-500 text-center py-4">No notifications yet.</p>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className={`p-2.5 rounded-xl transition-colors cursor-pointer text-left ${
                          notif.isRead ? 'bg-slate-900/40 opacity-70' : 'bg-slate-850 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h5 className="text-xs font-bold text-slate-200 flex items-center">
                            {!notif.isRead && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-bloodred-500"></span>}
                            {notif.title}
                          </h5>
                          <span className="text-[9px] text-slate-500">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Summary */}
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-200">{user.profile?.name || user.email}</span>
            <span className="text-[9px] uppercase tracking-wider font-semibold text-bloodred-500">
              {user.role} {user.role === 'DONOR' && `(${user.profile?.bloodGroup || 'O+'})`}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-bloodred-500 transition-colors"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-3">
          <a href="/login" className="text-xs font-semibold hover:text-bloodred-500 transition-colors px-3 py-1.5 text-slate-350">Login</a>
          <a
            href="/register"
            className="text-xs font-bold rounded-xl bg-bloodred-500 hover:bg-bloodred-600 text-white px-4 py-2 shadow-md shadow-bloodred-500/10 transition-colors"
          >
            Register
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
