import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      redirectUser(user.role);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Mock Google Sign-In trigger for the demo
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // Prompt donor name to populate account details
      const name = prompt("Enter your Name for Google Demo Login:", "Google User");
      if (name === null) {
        setLoading(false);
        return; // User cancelled
      }
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const googleEmail = `google.${randomId}@gmail.com`;

      const user = await loginWithGoogle(
        googleEmail,
        name || 'Google Demo User',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80'
      );
      redirectUser(user.role);
    } catch (err) {
      setError(err.message || 'Google Auth Error');
      setLoading(false);
    }
  };

  const redirectUser = (role) => {
    if (role === 'ADMIN') {
      navigate('/admin');
    } else if (role === 'HOSPITAL') {
      navigate('/hospital');
    } else {
      navigate('/donor');
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-slate-950">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-bloodred-900/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-rose-900/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="glass-panel p-8 rounded-3xl shadow-2xl border border-slate-800">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bloodred-500 text-white shadow-lg shadow-bloodred-500/25 mb-4 animate-pulse-heart">
              <Heart className="h-6 w-6 fill-current" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Welcome back</h2>
            <p className="text-xs text-slate-400 mt-1">Connect, match, and save lives today</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-bloodred-900/30 border border-bloodred-800/40 text-bloodred-200 text-xs text-left">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-350 mb-1.5">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-bloodred-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-350 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-bloodred-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-2.5 rounded-xl bg-bloodred-500 hover:bg-bloodred-600 text-white font-bold text-xs shadow-lg shadow-bloodred-500/15 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="text-xs text-slate-400 mt-6 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-bloodred-400 hover:text-bloodred-500 font-bold underline transition-colors">
              Register now
            </Link>
          </p>

          <div className="mt-8 p-3 rounded-xl bg-slate-900/60 border border-slate-800/40 text-[12px] text-slate-400 leading-normal text-left">
            💡 <b>Demo Tip:</b> Use the demo accounts below to sign in instantly. <br /> <br />
            • <b>Donor:  </b> <i> johndoe@bloodlink.com</i> / <i>donor123</i> <br />
            • <b>Hospital:  </b> <i> cityhospital@bloodlink.com</i> / <i>hospital123</i> 
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
