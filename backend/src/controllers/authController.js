import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userService from '../services/userService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeybloodlink2026';

/**
 * Helper to generate JWT Token.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Register a new user with donor or hospital profile.
 */
async function register(req, res) {
  const { email, password, role, name, phone, address, latitude, longitude, additionalDetails } = req.body;

  if (!email || !password || !role || !name) {
    return res.status(400).json({ error: 'Please provide all required fields.' });
  }

  try {
    // Check if user already exists
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and profile in model transaction
    const result = await userService.createUserWithProfile({
      email,
      password: hashedPassword,
      role,
      name,
      phone,
      address,
      latitude,
      longitude,
      additionalDetails
    });

    const userWithProfile = await userService.findById(result.id);
    const token = generateToken(userWithProfile);

    res.status(201).json({
      token,
      user: {
        id: userWithProfile.id,
        email: userWithProfile.email,
        role: userWithProfile.role,
        profile: userWithProfile.role === 'DONOR' ? userWithProfile.donorProfile : userWithProfile.hospitalProfile
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
}

/**
 * Login existing user.
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }

  try {
    const user = await userService.findByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.role === 'DONOR' ? user.donorProfile : user.hospitalProfile
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
}

/**
 * Mock Google Login (simulates authentication/auto-registration).
 */
async function googleLogin(req, res) {
  const { email, name, picture } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Google details missing.' });
  }

  try {
    let user = await userService.findByEmail(email);

    if (!user) {
      // Auto-register as DONOR if user doesn't exist
      const mockPassword = await bcrypt.hash('google_oauth_fallback_password_2026', 10);
      const result = await userService.createUserWithProfile({
        email,
        password: mockPassword,
        role: 'DONOR',
        name,
        phone: '555-0199',
        address: 'Google Account Address',
        latitude: 28.6139, // Default to Delhi
        longitude: 77.2090,
        additionalDetails: {
          bloodGroup: 'O+',
          age: 26,
          gender: 'Male',
          weight: 72
        },
        picture
      });

      user = await userService.findById(result.id);
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.role === 'DONOR' ? user.donorProfile : user.hospitalProfile
      }
    });

  } catch (error) {
    console.error('Google OAuth Mock error:', error);
    res.status(500).json({ error: 'Server error during Google Authentication.' });
  }
}

/**
 * Get current session info.
 */
async function getMe(req, res) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token missing' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userService.findById(decoded.id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.role === 'DONOR' ? user.donorProfile : user.hospitalProfile
      }
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export {
  register,
  login,
  googleLogin,
  getMe
};
