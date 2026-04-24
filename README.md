# TOBLI — Location-Based Business Discovery

A premium location-based business discovery platform built with React, Vite, and InsForge. Tobli lets users find nearby businesses on a live map, view product listings and prices, and contact businesses directly — all from a single interface.

## Tech Stack

| Layer              | Technology                                      |
|--------------------|--------------------------------------------------|
| **Frontend**       | React 19 + Vite 6 + Tailwind CSS + Framer Motion |
| **Routing**        | React Router v6                                  |
| **State**          | Zustand & TanStack React Query                   |
| **Backend**        | InsForge (Postgres, Auth, Storage, Realtime)     |
| **Payments**       | Pesapal (Mobile Money, Cards)                    |
| **Maps**           | Leaflet with custom dark-mode tiles              |
| **Icons**          | Lucide React                                     |
| **Deployment**     | Any static host (Vercel, Netlify, Cloudflare)    |

---

## Features

### User's Page (Map View)
- **Live map** with dark-mode CartoDB tiles centered on the user's GPS location.
- **Search bar** with typewriter prompt — searches items across all businesses via InsForge.
- **Nearest-first results** — ranked by distance from the user; cycle through alternatives with "Next Alternative".
- **Business pop-up sheet** showing product name, price, business name, and contact links (WhatsApp, Call, Instagram, X, Website, Directions).
- **Dynamic routing line** — a dashed polyline connects the user to the selected business, and the map auto-zooms to fit both.
- **"+Add" button** for quick signup/login access.
- **Live user presence** — Real-time heartbeat tracking of all active visitors (authenticated and anonymous) via unique session IDs.

### Authentication & Account
- **Secure Access**: Full Row-Level Security (RLS) implementation on all database tables to protect user and business data.
- **Signup** (`/signup`) — Business Name, Owner Name, Phone, Email, Password with Terms & Privacy consent checkbox.
- **Login** (`/login`) — Email or phone number login.
- **Forgot Password** (`/forgot-password`) — Email-based password reset flow.
- **Reset Password** (`/reset-password`) — Code verification and new password entry.

### Business Dashboard (`/dashboard`)
- **Header**: Business name (left), colored Open/Closed toggle (center), Logout button (right).
- **Overview Tab**: Subscription status, open/closed status, goods/services count, and **Map Appearances** (analytics for the last 24 hours).
- **Listings Tab**: Add/edit/remove items with name, price, image, and availability toggle. Search listings.
- **Business Info Tab**: Edit owner name, business name, contacts (WhatsApp, Phone, Instagram, X, Website), and pin GPS location.
- **Subscription Tab**: View expiry date, last payment date, and trigger renewal via Pesapal.

### Admin Dashboard (`/admin`)
- **Overview Tab**: Registered businesses, live (open) businesses, **Total Live Visitors**, income for the month.
- **Businesses Tab**: Table with Owner Name, Business Name, Phone, Email, Open Status, Payment Status, and suspend/activate actions.
- **Transactions Tab**: Lists all subscription payments (with Pesapal references) and export-to-CSV.

### Legal (`/terms`, `/privacy`)
- **Terms & Conditions** — 16-section document covering account usage, subscriptions, payments via Pesapal, user content, IP, liability, and dispute resolution under Ugandan law.
- **Privacy Policy** — 13-section document compliant with Uganda's Data Protection and Privacy Act, 2019 (DPPA), covering data collection, legal bases, retention, cross-border transfers, and user rights.

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_INSFORGE_URL=https://your-project.insforge.app
VITE_INSFORGE_ANON_KEY=your-anon-key
```

### 3. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 4. Build for production

```bash
npm run build
npm run preview   # preview the production bundle locally
```

Deploy the generated `dist/` directory to your preferred static host.

---

## Environment Variables

| Name                        | Description                                 |
|-----------------------------|---------------------------------------------|
| `VITE_INSFORGE_URL`        | Public URL for the InsForge project         |
| `VITE_INSFORGE_ANON_KEY`   | Public anon key used by the frontend        |

---

## Project Structure

```
src/
├── components/
│   ├── MapDirectory.jsx       # Main Leaflet map with markers & routing
│   ├── PresenceManager.jsx    # Real-time user presence heartbeat
│   └── SearchOverlay.jsx      # Search bar with typewriter + results
├── lib/
│   ├── insforge.js            # InsForge client
│   ├── excel.js               # Excel import/export helpers
│   └── queryClient.js         # TanStack Query client
├── pages/
│   ├── Home.jsx               # User-facing map page
│   ├── Dashboard.jsx          # Business owner dashboard
│   ├── Admin.jsx              # Admin dashboard
│   ├── Login.jsx              # Login page
│   ├── Signup.jsx             # Signup page
│   ├── ForgotPassword.jsx     # Password reset request
│   ├── ResetPassword.jsx      # Password reset confirmation
│   ├── Terms.jsx              # Terms & Conditions
│   └── Privacy.jsx            # Privacy Policy (DPPA-compliant)
├── store/
│   ├── authStore.js           # Zustand auth state
│   └── useStore.js            # Zustand app state (search, map, etc.)
├── App.jsx                    # Root component with routing
```

---

Built with ❤️ by the Tobli team.
