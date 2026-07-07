# BloodLink – AI-Powered Blood Donation & Emergency Matching Platform

BloodLink is a modern full-stack web application designed to bridge the gap between blood donors and healthcare facilities. By utilizing AI-powered triage and precise geolocation-based matching, BloodLink helps hospitals find compatible donors, manage emergency donation workflows, and reward life-saving acts.

---

## 🚀 Key Features

### 🏥 For Hospitals
- **Emergency Blood Request Triage**: Post blood needs with detailed diagnosis appeals.
- **AI-Powered Emergency Classification**: Integrates Google Gemini AI to analyze case descriptions, determine severity scores (0-100), and auto-detect critical urgency levels.
- **AI Smart Post Writer**: Instantly generate compelling Outreach Posts to invite local donors.
- **AI Donor Matching & Suitability Ranking**: View list of nearby medically eligible donors ranked by GPS distance and donation suitability.
- **Razorpay Premium Plans**: Subscribe to premium plans (Starter, Professional, Enterprise) with monthly or yearly billing cycles.
- **Donation Certificate Issuer**: Mark donations as complete to automatically generate and issue digital certificates to donors.

### 🩸 For Donors
- **Proximity Alerts**: Receive real-time dashboard notifications for nearby emergency blood requests matching their blood type.
- **Eligibility Verification**: Automatic tracker enforcing a medically standard 56-day cool-off period between whole blood donations.
- **Interactive FAQ Bot**: Ask questions about eligibility (tattoos, diabetes, etc.) and receive accurate, instant answers with medical disclaimers using Gemini AI.
- **Donation History & Certificates**: View completed donation records and digital appreciation awards.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React (Vite), Axios, Tailwind CSS, Leaflet Maps, Lucide Icons |
| **Backend** | Node.js, Express, MongoDB (Mongoose) |
| **Authentication** | JSON Web Tokens (JWT), bcryptjs |
| **AI Integration** | Google Generative AI SDK (`gemini-1.5-flash` with failover to `gemini-1.5-pro`) |
| **Payment Gateway** | Razorpay Node SDK & Checkout JS |

---

## 📂 Project Structure

```text
├── backend/                   # Node.js + Express API
│   ├── src/
│   │   ├── config.js          # Dotenv initialization
│   │   ├── db.js              # MongoDB Atlas connection
│   │   ├── controllers/       # Controller handlers (auth, request, hospital, admin)
│   │   ├── middleware/        # Authentication & Role checking
│   │   ├── models/            # Mongoose Schemas (User, profiles, requests, notifications)
│   │   ├── routes/            # Express route mountings
│   │   ├── services/          # Business logic layers (Gemini, Matching, Razorpay)
│   │   └── server.js          # App entrypoint
│   └── package.json
│
├── frontend/                  # React (Vite) Single Page Application
│   ├── src/
│   │   ├── assets/            # Global styling
│   │   ├── components/        # Shared components
│   │   ├── context/           # React Auth State context
│   │   ├── pages/             # Layout pages (dashboards, login, landing)
│   │   ├── services/          # Axios instance configured with interceptors
│   │   └── main.jsx
│   ├── index.html
│   ├── vercel.json            # Vercel SPA route rewrites configuration
│   └── package.json
```

---

## ⚙️ Getting Started Locally

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   DATABASE_URL=your_mongodb_atlas_connection_string
   JWT_SECRET=your_secure_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```
4. Start the backend server in development mode:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
4. Start the frontend dev server:
   ```bash
   npm run dev
   ```

---

## ☁️ Deployment

### Deployed Services
- **Backend**: Hosted on [Render](https://render.com/) at `https://bloodlink-backend-jnhc.onrender.com`
- **Frontend**: Hosted on [Vercel](https://vercel.com/) at `https://bloodlink-frontend-ochre.vercel.app/`

### Deployment Setup Details

#### Render (Backend)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- Ensure all environment variables listed in the backend `.env` configuration are added under **Render Web Service Settings -> Environment Variables**.

#### Vercel (Frontend)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- Configure these environment variables in your Vercel Dashboard:
  - `VITE_RAZORPAY_KEY_ID`
  - `VITE_API_BASE_URL` (points to your live backend Render URL + `/api`)
