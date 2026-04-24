# 🏥 MedRemind - Full Stack Healthcare & Medication Platform

MedRemind is a production-ready healthcare management system designed for patients, caregivers, and doctors. It provides a seamless, role-based ecosystem for medication adherence, real-time alerts, vital tracking, and clinical oversight.

---

## 🌟 Core Philosophy

- **Patient Interface**: Minimalist and action-oriented. Focuses on "What do I take now?" with one-tap logging, real-time medication alerts, and snooze support.
- **Caregiver Interface**: Monitoring-oriented. Provides live status updates, missed-dose alerts, and historical adherence analytics for linked patients.
- **Doctor Interface**: Data-oriented. High-level clinical oversight, patient directory management, risk scoring, and remote prescription capabilities.

---

## 📂 Project Architecture & Structure

The project follows a clean **Controller-Route** pattern on the backend and a structured **Pages-Assets** organization on the frontend.

### 📁 Backend (`/backend`)
- `server.js` — Central entry point. Handles middleware, API routing, and static file serving.
- `controllers/` — 🔥 Business Logic Layer
  - `authController.js` — Login, registration, JWT issuance
  - `medicineController.js` — CRUD for medications + frequency/day scheduling fields
  - `logController.js` — Medication intake logging (taken/skipped) + adherence stats
  - `vitalsController.js` — Heart rate & blood pressure logging per patient
  - `userController.js` — Profile updates, patient linking, role-based user queries
- `routes/` — Lightweight routing definitions pointing to controllers
- `config/db.js` — MongoDB connection management
- `middleware/auth.js` — JWT verification + role-based route protection
- `models/` — Mongoose data schemas
- `seed.js` — Database seeder with sample patient, caregiver, and doctor accounts

### 📁 Frontend (`/frontend`)
- `index.html` — Login page
- `register.html` — Registration page
- `dashboard.html` — Main dashboard (role-aware: patient / doctor / caregiver)
- `medicines.html` — Medication management (add, edit, delete, filter)
- `history.html` — Adherence history with CSV export
- `profile.html` — User profile & account settings
- `js/api.js` — Central `apiFetch()` wrapper (auto-switches between local/production API URLs)
- `js/auth.js` — Login/register logic + JWT storage
- `js/layout.js` — Shared sidebar, header, and navigation engine (injected on all pages)
- `js/dashboard.js` — Role-specific dashboard views (patient, doctor, caregiver)
- `js/medicines.js` — Medicine form handling (CRUD, day picker, frequency logic)
- `js/scheduler.js` — Real-time medication alert system with snooze
- `js/history.js` — Adherence log rendering + CSV export
- `css/style.css` — Global design system (sidebar, cards, animations)

---

## 🗄️ Database Schema (Mongoose)

### 👤 User Model
| Field | Type | Description |
|---|---|---|
| `name` | String | Full user name |
| `email` | String | Unique login identifier |
| `password` | String | Hashed with BcryptJS (salt: 10) |
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
| `frequency` | String | `Daily`, `Twice Daily`, `Every Other Day`, `Weekly`, `As Needed` |
| `daysOfWeek` | [Number] | Days for Weekly frequency (0=Sun … 6=Sat) |
| `startDate` | Date | Reference date for Every Other Day alternation |
| `status` | Enum | `active`, `on hold`, `completed` |
| `date` | Date | Creation timestamp |

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

## ✨ Feature List

### 🔐 Authentication & Security
- **JWT Authentication** — Tokens issued on login, required on all protected API routes via `Authorization: Bearer <token>`
- **Role-Based Access Control (RBAC)** — Patient, Caregiver, Doctor roles with strict data isolation
- **Password Hashing** — bcryptjs with salt factor 10; plaintext passwords never stored
- **Auto Logout** — 401 responses automatically clear session and redirect to login
- **Input Validation** — Server-side required field checks and role validation on all endpoints

### 🏥 Role-Specific Dashboards
- **Patient Dashboard** — Greeting, live next-dose countdown timer, today's medication schedule, upcoming dose hero card, weekly adherence chart, AI-style insights, daily progress bar
- **Doctor Dashboard** — Clinical Control Center with patient directory, adherence % per patient, risk level scoring (Low/Medium/High), critical care alerts, "New Prescription" modal
- **Caregiver Dashboard** — Family Health Alerts, linked patient cards with adherence bars, missed dose indicators, link/unlink patients

### 💊 Medication Management
- **Full CRUD** — Add, edit, delete medications; doctors can prescribe to any patient
- **Doctor Notes** — Doctors can securely attach specific notes (e.g. "Take after meals") to a prescription which is visibly rendered inline for patients and caregivers
- **Frequency Options** — Daily, Twice Daily, Every Other Day, Weekly, As Needed
- **Weekly Day Picker** — Interactive Sun–Sat checkbox selector shown when "Weekly" is chosen
- **Status Control** — Active / On Hold / Completed with quick pause/activate toggle
- **Smart Filtering** — Filter medicine list by Active, On Hold, Completed, or All
- **Inline Delete Confirm** — Custom inline confirmation bar instead of browser `confirm()`

### ⏰ Real-Time Medication Alerts (Scheduler)
- **Auto-polling** — Checks every 30 seconds for medicines due at the current time
- **Modal Alert** — Elegant in-app popup with medicine name, time, dosage, and frequency
- **✅ Taken Button** — Logs the dose via API and shows a success toast; removes the modal
- **💤 Snooze Button** — Dismisses the alert and re-fires it exactly **10 minutes later**
- **Snooze Toast** — Confirms "Snoozed! Reminder in 10 minutes." with a countdown feel
- **Browser Notification** — Native OS notification fires alongside the in-app modal (if permission granted)
- **Frequency-Aware** — Alerts only fire on days the medicine is actually scheduled (respects Weekly days and Every Other Day alternation)
- **Deduplication** — Each medicine only triggers one alert per minute even if the polling overlaps

### 📅 Frequency-Aware Daily Schedule Reset
- **Auto-reset on day change** — Today's schedule is always derived from today's logs, so it resets automatically at midnight with no manual intervention
- **Daily / Twice Daily** — Always appear in the schedule
- **Every Other Day** — Alternates based on the medicine's `startDate` (even/odd day count)
- **Weekly** — Only appears on the exact days of the week selected (e.g., Mon/Wed/Fri)
- **As Needed** — Always visible; patient decides when to take

### 📊 Adherence Tracking & History
- **Weekly Progress Chart** — Bar chart (Chart.js) showing adherence % for each day of the past week
- **Daily Progress Bar** — Live percentage of today's medicines taken
- **Insights Panel** — Context-aware tip (perfect adherence, missed dose warning, general reminder)
- **History Page** — Full log of taken/skipped entries with date filtering and interactive filtering
- **Daily Adherence Calendar** — Visually scrollable 30-day calendar grid displaying perfect adherence (green), missed doses (red), and missing data (gray)
- **Streak Counter** — Live calculation of the user's current and longest consecutive full-adherence days
- **CSV Export** — Download complete adherence history as a CSV file

### 🩺 Doctor Features
- **Patient Directory** — Table with name, email, adherence %, last missed date, risk level badge
- **Risk Scoring** — Auto-calculated: Low (≥80%), Medium (50–79%), High (<50%)
- **Critical Alerts** — Flags patients with adherence <60%, 3+ missed doses in 3 days, or 2+ days inactive
- **Patient Clinical File** — Modal with avg adherence, heart rate, blood pressure, active prescriptions, recent logs
- **New Prescription & Doctor Notes** — Doctor can prescribe medicines directly to any patient from a modal and attach private-write/public-read clinical notes
- **Adjust Prescription** — Accessible from the patient file modal

### 👨‍👩‍👧 Caregiver Features
- **Link Patient** — Link a patient by email; caregiver can monitor their adherence
- **Family Health Alerts** — Live panel showing which patients missed doses or have low adherence
- **Patient Cards** — Adherence bar, last activity time, missed-dose warning badge, call/email shortcuts

### 🎨 UI / UX
- **Shared Sidebar** — Rendered by `layout.js` on all pages; includes the MedRemind logo, role-specific nav links, and a Logout button
- **Clickable Logo** — The MedRemind logo/icon in the top left navigates to the Dashboard on all pages
- **Structured Header** — Top bar aligns the user avatar + name on the right; a role-aware greeting ("Hello, John") is exclusively rendered on the Dashboard panel to keep other tabs clean and focused.
- **Clickable Avatar** — Profile image in the header links directly to the My Profile page
- **Dynamic Avatars** — DiceBear API generates unique avatars seeded from the user's name
- **Mobile Navigation** — Bottom nav bar for mobile devices with icon + label
- **Micro-animations** — Slide-up, fade-in, bounce-in animations throughout
- **Glassmorphism Cards** — Premium card design with border and shadow system
- **Toast Notifications** — Non-blocking success/error toasts for all user actions
- **Tailwind CSS** — Via CDN with custom color tokens (primary, secondary, danger)
- **Google Fonts** — Inter (body) + Outfit (display/headings)
- **Lucide Icons** — Consistent icon library across all pages

### 👤 Profile Page
- **Personal Information** — Displays name, email, age, member since date
- **Edit Profile** — Inline edit form for name and age with API persistence
- **Health Verification Card** — Role-specific badge (Patient Verified / Clinical Credentials / Caregiver Access)
- **Live Medication Count** — Shows active medicine count pulled from the API
- **Avatar** — Auto-generated from user name via DiceBear

---

## 🔐 Security Implementation

1. **RBAC** — Patients only access their own data; caregivers only access linked patients; doctors have read access to all patients
2. **JWT** — Issued on login, expiry enforced, stored in `localStorage`
3. **Password Hashing** — bcryptjs, never stored in plaintext
4. **API Input Validation** — Server-side checks for required fields, role validity, and ownership before any write operation
5. **Ownership Checks** — Medication/log updates verify the requesting user is the owner, the patient's doctor, or a linked caregiver

---

## 🚀 Running Locally

### Prerequisites
- Node.js ≥ 18
- MongoDB (local instance or Atlas cloud URI)

### 1. Clone & Configure
```bash
# Backend environment
# Edit backend/.env:
MONGO_URI=mongodb://localhost:27017/medremind
JWT_SECRET=your_secret_key
PORT=5000
```

### 2. Seed the Database (Optional)
```bash
cd backend
node seed.js
```
This creates sample accounts:
| Role | Email | Password |
|---|---|---|
| Patient | patient@example.com | password123 |
| Caregiver | caregiver@example.com | password123 |
| Doctor | doctor@example.com | password123 |

### 3. Start Backend
```bash
cd backend
npm install
npm run dev   # nodemon on port 5000
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev   # Vite on http://localhost:5173
```

The frontend auto-detects `localhost` and points API calls to `http://localhost:5000/api`.

---

## 🚀 Deployment Strategy (Separate Architecture)

### 1. 🏁 Backend — Render / Railway / Heroku
- Serves as the "Brain": DB connection, JWT issuance, data processing
- `cors({ origin: '*' })` enabled to allow the separate frontend to communicate

### 2. 🎨 Frontend — Vercel / Netlify
- Purely static HTML/JS/CSS
- `frontend/vercel.json` configured for clean URL routing
- `frontend/js/api.js` dynamically switches API URL:
  - `localhost` → `http://localhost:5000/api`
  - Production → `https://medremind-backend.onrender.com/api`

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, Vanilla JS, Tailwind CSS (CDN) |
| Icons | Lucide Icons |
| Charts | Chart.js |
| Fonts | Google Fonts (Inter, Outfit) |
| Avatars | DiceBear API |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Dev Server | Vite (frontend), Nodemon (backend) |

---

*MedRemind: Bridging clinical data with daily life.*
