import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, User, Building, MapPin, Navigation, ArrowRight, Shield } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('DONOR'); // 'DONOR' or 'HOSPITAL'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  
  // Donor specific fields
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [weight, setWeight] = useState('');

  // Hospital specific fields
  const [licenseNumber, setLicenseNumber] = useState('');

  const [error, setError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get coordinates using HTML5 Geolocation API
  const fetchGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setGpsLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Failed to fetch GPS coordinates. Please input coordinates manually (e.g., Delhi: 28.6139, 77.2090).');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !name || !latitude || !longitude) {
      setError('Please fill in all required fields including GPS coordinates.');
      return;
    }

    setError('');
    setLoading(true);

    const payload = {
      email,
      password,
      role: email.toLowerCase().includes('admin') ? 'ADMIN' : role,
      name,
      phone,
      address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      additionalDetails: role === 'DONOR' ? {
        bloodGroup,
        age: parseInt(age),
        gender,
        weight: parseFloat(weight)
      } : {
        licenseNumber
      }
    };

    try {
      await register(payload);
      if (role === 'HOSPITAL') {
        navigate('/hospital');
      } else {
        navigate('/donor');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden bg-slate-950">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-bloodred-900/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-rose-900/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-xl z-10">
        <div className="glass-panel p-8 rounded-3xl shadow-2xl border border-slate-800">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-bloodred-500 text-white shadow-lg mb-3">
              <Heart className="h-5.5 w-5.5 fill-current animate-pulse-heart" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Create your account</h2>
            <p className="text-xs text-slate-400 mt-0.5">Register as a life-saving Donor or verified Hospital</p>
          </div>

          {/* Role selector */}
          <div className="flex border border-slate-800 rounded-xl overflow-hidden p-1 bg-slate-900/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setRole('DONOR');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                role === 'DONOR' ? 'bg-bloodred-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Blood Donor</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('HOSPITAL');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                role === 'HOSPITAL' ? 'bg-bloodred-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building className="h-4 w-4" />
              <span>Hospital / Bank</span>
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-bloodred-900/30 border border-bloodred-800/40 text-bloodred-200 text-xs text-left">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Common Fields */}
              <div>
                <label className="block text-xs font-semibold text-slate-350 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-bloodred-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-350 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-bloodred-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-350 mb-1">
                  {role === 'DONOR' ? 'Full Name *' : 'Hospital / Organization Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'DONOR' ? 'John Doe' : 'City Red Cross'}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-bloodred-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-350 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-bloodred-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-350 mb-1">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, Zip"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-bloodred-500"
                />
              </div>

              {/* Geolocation Coordinate Fetching */}
              <div className="md:col-span-2 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 flex items-center"><MapPin className="mr-1.5 h-4 w-4 text-bloodred-400" /> GPS Geolocation *</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Required for nearby emergency donor matching.</p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchGPS}
                    disabled={gpsLoading}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center space-x-1 border border-slate-700 transition-colors"
                  >
                    <Navigation className="h-3 w-3 text-bloodred-400 animate-pulse" />
                    <span>{gpsLoading ? 'Locating...' : 'Get GPS Location'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block mb-1">Latitude</span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="e.g. 28.6139"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-850 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block mb-1">Longitude</span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="e.g. 77.2090"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-850 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Donor Profile Fields */}
              {role === 'DONOR' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-350 mb-1">Blood Group *</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-bloodred-500"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-350 mb-1">Age *</label>
                    <input
                      type="number"
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Min 17 years"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-bloodred-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-350 mb-1">Gender *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-bloodred-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-350 mb-1">Weight (kg) *</label>
                    <input
                      type="number"
                      required
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Min 50 kg"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* Hospital Profile Fields */}
              {role === 'HOSPITAL' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-350 mb-1">Medical License / Certificate ID *</label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. LIC-REG-XXXXXX"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-bloodred-500"
                  />
                  <span className="text-[10px] text-amber-500 mt-1.5 flex items-center font-semibold">
                    <Shield className="mr-1 h-3 w-3 shrink-0" /> Note: Hospital registrations must be approved by the platform Admin before posting.
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-2.5 rounded-xl bg-bloodred-500 hover:bg-bloodred-600 text-white font-bold text-xs shadow-lg shadow-bloodred-500/15 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Creating account...' : 'Create Account'}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="text-xs text-slate-400 mt-6 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-bloodred-400 hover:text-bloodred-500 font-bold underline transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
