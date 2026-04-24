# 🏥 MedRemind - Full Stack Healthcare & Medication Platform

MedRemind is a premium, production-ready healthcare management system designed for patients, caregivers, and doctors. It provides a seamless, role-based ecosystem for medication adherence, vital tracking, and clinical oversight.

---

## 🌟 Core Philosophy
- **Patient Interface**: Minimalist and action-oriented. Focuses on "What do I take now?" with one-tap logging for elderly-friendly accessibility.
- **Caregiver Interface**: Monitoring-oriented. Provides live status updates and historical adherence analytics for linked patients.
- **Doctor Interface**: Data-oriented. High-level clinical oversight, patient directory management, and remote prescription capabilities.

---

## 📂 Project Architecture & Structure (Elite Production Grade)

The project follows a clean **Controller-Route** pattern on the backend and a structured **Pages-Assets** organization on the frontend.

### 📁 Backend (`/backend`)
- `server.js`: Central entry point. Handles middleware, API routing, and static serving.
- `controllers/`: 🔥 **New Business Logic Layer**
    - `authController.js`, `medicineController.js`, `logController.js`, `vitalsController.js`, `userController.js`.
- `routes/`: Lightweight routing definitions pointing to controllers.
- `config/db.js`: MongoDB connection management.
- `middleware/`: JWT verification and role-based protection.
- `models/`: Data schemas.

### 📁 Frontend (`/frontend`)
- `pages/`: 📂 **New Centralized Page Directory**
    - `index.html`, `dashboard.html`, `medicines.html`, etc.
- `js/`: Modular logic including `api.js` (central fetch) and `layout.js` (UI engine).
- `css/main.css`: Design system entry point.
- `postcss.config.js` & `tailwind.config.js`: Modern build configuration.

---

## 🗄️ Database Schema (Mongoose)

### 👤 User Model
| Field | Type | Description |
|---|---|---|
| `name` | String | Full user name |
| `email` | String | Unique login identifier |
| `password` | String | Hashed using BcryptJS |
| `role` | Enum | `patient`, `caregiver`, `doctor` |
| `age` | Number | Patient specific |
| `doctorName` | String | Patient specific |
| `caregiverId` | ObjectId | Reference to a Caregiver (for Patients) |
| `patientIds` | [ObjectId] | Array of Patient references (for Caregivers) |

### 💊 Medicine Model
| Field | Type | Description |
|---|---|---|
| `user` | ObjectId | Owner of the medication |
| `name` | String | Medication name (e.g., Metformin) |
| `dosage` | String | e.g., 500mg |
| `time` | String | Scheduled time (e.g., 08:00 AM) |
| `frequency` | String | e.g., Daily, Weekly |
| `status` | Enum | `active`, `on hold`, `completed` |

### 📝 Log Model
| Field | Type | Description |
|---|---|---|
| `user` | ObjectId | Patient who performed the action |
| `medicine` | ObjectId | Reference to the specific medicine |
| `status` | Enum | `taken`, `skipped` |
| `date` | Date | Timestamp of the log entry |

### 💓 Vitals Model
| Field | Type | Description |
|---|---|---|
| `user` | ObjectId | Reference to the Patient |
| `heartRate` | Number | BPM |
| `bloodPressure` | Object | `{ systolic, diastolic }` |
| `weight` | Number | kg/lbs |

---

## 🔐 Security Implementation

1. **Role-Based Access Control (RBAC)**: 
   - Patients can only view/edit their own data.
   - Caregivers can only view data for patients explicitly linked to them.
   - Doctors can view all patients in their clinic but cannot modify patient passwords.
2. **JWT Authentication**: Tokens are issued upon login and must be provided in the `Authorization: Bearer <token>` header for all API requests.
3. **Password Hashing**: Never stored in plain text; handled by `bcryptjs` with a salt factor of 10.
4. **Input Validation**: Server-side checks ensure roles are valid and required fields are present before database operations.

---

## 🛠️ Technical Fixes & Improvements Log

### Phase 1: Infrastructure & Stability
- **Fixed Static Serving**: Resolved "Unexpected token '<'" error by ensuring `express.static` correctly serves the `frontend` folder and redirects all non-API routes to `index.html` (SPA support).
- **Absolute Pathing**: Standardized all script/link tags in HTML to use absolute root paths (`/js/...`) to prevent broken requests on sub-routes.
- **Root Orchestration**: Created a root `package.json` to allow running the full stack via `npm run dev` from a single terminal.

### Phase 2: Security & RBAC
- **Hardened Routes**: Added relationship verification in `logs.js` and `vitals.js` to prevent data leakage between unrelated users.
- **Variable Shadowing Fix**: Refactored `auth.js` to rename internal variables (e.g., `user` to `foundUser`) avoiding confusion with Mongoose models and fixing IDE linting errors.

### Phase 3: Premium UI/UX
- **Tailwind Production Prep**: Transitioned from CDN to a local PostCSS/Vite-ready configuration with `tailwind.config.js`.
- **CSS Alignment Sweep**: Fixed massive vertical gaps on the Login page and standardized the Registration grid for a professional, balanced look.
- **Vitals Modal**: Replaced browser `prompt()` calls with a modern, animated "Log Health Vitals" modal in the dashboard.
- **Dynamic Avatars**: Integrated DiceBear API for role-specific, seed-based user avatars.

---

## 🚀 Deployment Guide

### Backend (Render/Heroku/Railway)
1. Set `NODE_ENV=production`.
2. Configure `MONGO_URI` with your MongoDB Atlas connection string.
3. Configure `JWT_SECRET` with a secure random string.

### Frontend (Vercel/Netlify)
1. Update `API_URL` in `frontend/js/api.js` to point to your deployed backend.
2. Vercel will automatically use `vercel.json` to handle the SPA routing.

---
*MedRemind: Bridging clinical data with daily life.*
