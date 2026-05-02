# TOBLI — Location-Based Business Discovery

A premium location-based business discovery platform built with React, Vite, and InsForge. Tobli lets users find nearby businesses on a live map, view product listings and prices, and contact businesses directly — all from a single interface.

---

## Tech Stack

| Layer              | Technology                                      |
|--------------------|--------------------------------------------------|
| **Frontend**       | React 19 + Vite 6 + Tailwind CSS + Framer Motion |
| **Routing**        | React Router v6                                  |
| **State**          | Zustand & TanStack React Query                   |
| **Backend**        | InsForge (Postgres, Auth, Storage, Realtime)     |
| **Payments**       | Pesapal (Mobile Money, Cards)                    |
| **Maps**           | Leaflet + PostGIS (spatial queries)              |
| **Icons**          | Lucide React                                     |
| **Deployment**     | Any static host (Vercel, Netlify, Cloudflare)    |

---

## Features

### User's Page (Map View)
- **Live map** with dark-mode CartoDB tiles centered on the user's GPS location.
- **Search bar** with typewriter prompt — searches items across all businesses via InsForge PostGIS `search_nearby` function.
- **Nearest-first results** — ranked by distance from the user; cycle through alternatives with "Next Alternative".
- **Business pop-up sheet** showing product name, price, business name, and contact links (WhatsApp, Call, Instagram, X, Website, Directions).
- **Dynamic routing line** — a dashed polyline connects the user to the selected business via OSRM, and the map auto-zooms to fit both.
- **Live user presence** — Real-time heartbeat tracking of all active visitors via unique session IDs.

### Authentication & Account
- **Email + OTP verification** — 6-digit code sent on signup, verified before account activation.
- **Email or phone login** — Phone numbers are resolved to emails server-side.
- **Password reset** — Two flows: email code-based reset (`/forgot-password`) and link-based reset (`/reset-password`).
- **Password strength** — Minimum 8 characters, requires uppercase, lowercase, and a number.

### Business Dashboard (`/dashboard`)
- **Header**: Business name (left), colored Open/Closed toggle (center), Logout button (right).
- **Overview Tab**: Subscription status, open/closed status, listings count, and **Map Appearances** (analytics for the last 24 hours).
- **Listings Tab**: Add/edit/remove items with name, price, image upload (compressed to 400KB), and availability toggle.
- **Business Info Tab**: Edit owner name, business name, contacts (WhatsApp, Phone, Instagram, X, Website), and pin GPS location.
- **Subscription Tab**: View expiry date, last payment date, and trigger renewal via Pesapal.

### Admin Dashboard (`/admin`)
- **Overview Tab**: Registered businesses, live (open) businesses, live visitors count, monthly income.
- **Businesses Tab**: Full table with owner info, status, payment status, and activate/suspend actions.
- **Transactions Tab**: All subscription payments with Pesapal references and CSV export.

### Legal
- **Terms & Conditions** (`/terms`) — 16-section document covering account usage, subscriptions, payments, content, IP, liability, and dispute resolution under Ugandan law.
- **Privacy Policy** (`/privacy`) — 13-section document compliant with Uganda's Data Protection and Privacy Act, 2019 (DPPA).

---

## Architecture

### Frontend Architecture

```
src/
├── components/
│   ├── MapDirectory.jsx       # Leaflet map with markers, popups, routing & recenter
│   ├── PresenceManager.jsx    # Real-time presence heartbeat via InsForge Realtime
│   └── SearchOverlay.jsx      # Search bar with typewriter animation + results dropdown
├── lib/
│   ├── insforge.js            # InsForge client initialization (baseUrl + anonKey)
│   ├── excel.js               # Excel import/export helpers (XLSX)
│   └── queryClient.js         # TanStack React Query client config
├── pages/
│   ├── Home.jsx               # User-facing map page (MapDirectory + SearchOverlay)
│   ├── Dashboard.jsx          # Business owner dashboard (4 tabs)
│   ├── Admin.jsx              # Admin dashboard (3 tabs)
│   ├── Login.jsx              # Email/phone login
│   ├── Signup.jsx             # Multi-step signup with OTP verification
│   ├── ForgotPassword.jsx     # Code-based password reset
│   ├── ResetPassword.jsx      # Link-based password reset
│   ├── Terms.jsx              # Terms & Conditions
│   └── Privacy.jsx            # Privacy Policy
├── store/
│   ├── authStore.js           # Zustand: session, business profile, admin status, auth actions
│   └── useStore.js            # Zustand: map state, search results, presence, directions
├── App.jsx                    # Root component with React Router routes
├── main.jsx                   # Entry point
└── index.css                  # Global styles + Tailwind imports
```

#### State Management

**`authStore.js`** (Zustand) — Manages authentication state:
- `session` — Current user session from InsForge Auth
- `business` — The user's business profile from the `businesses` table
- `isAdmin` — Whether the user exists in the `admins` table (server-verified)
- Auth actions: `signUp`, `signIn`, `signOut`, `verifyEmailAndCreateBusiness`, `sendResetPasswordEmail`, `resetPasswordWithCode`, `resetPassword`

**`useStore.js`** (Zustand) — Manages app state:
- `userLocation` — GPS coordinates from the browser Geolocation API
- `selectedBusiness` — Currently selected search result on the map
- `searchResults` — Array of results from `search_nearby` RPC
- `liveUsers` — Map of session IDs to presence data (heartbeat tracking)
- `showDirections` — Whether to show the routing polyline

#### Key Frontend Patterns
- **Auth guard**: Dashboard and Admin pages redirect unauthenticated users to `/login` via `useEffect` checks on `session`, `business`, and `isAdmin`.
- **Image uploads**: Files are validated (MIME type whitelist: `image/jpeg`, `image/png`, `image/webp`, `image/gif`), compressed to 400KB max via `browser-image-compression`, then uploaded to InsForge Storage bucket `tobli-media`.
- **Search**: Debounced (400ms) calls to the `search_nearby` PostGIS function. Results are deduplicated by `business_id` for map markers.
- **Presence**: Each browser tab generates a unique `SESSION_ID` via `crypto.randomUUID()`, stored in `sessionStorage`. Heartbeats are published every 10s to the `global_presence` Realtime channel. Stale sessions (>25s without heartbeat) are pruned every 15s.

---

### Backend Architecture (InsForge + Postgres)

The backend runs entirely on InsForge — a managed platform providing Postgres, Auth, Storage, Realtime, and Edge Functions. There is no custom server; all business logic is enforced via **Row-Level Security (RLS) policies** and **database triggers**.

#### Database Schema

```
migrations/
├── schema.sql                 # Full schema: tables, triggers, indexes, RLS policies
├── postgis_migration.sql      # PostGIS extension + spatial search function
└── security_fixes.sql         # Security hardening (column protection trigger, tightened RLS)
```

##### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `businesses` | Business profiles linked to auth users | `id` (UUID PK), `auth_user_id` (FK to auth.users), `name`, `owner_name`, `sector`, `lat`, `lng`, `location` (PostGIS GEOGRAPHY), `phone`, `email`, `whatsapp`, `instagram`, `x_handle`, `website`, `subscription_status`, `is_open`, `is_admin` |
| `items` | Products/services listed by businesses | `id` (UUID PK), `business_id` (FK), `name`, `type` (product/service), `price`, `image_url`, `available`, `featured` |
| `subscriptions` | Payment records for business subscriptions | `id` (UUID PK), `business_id` (FK), `amount`, `paid_at`, `expires_at`, `method`, `pesapal_reference` (UNIQUE) |
| `admins` | Platform administrator whitelist | `user_id` (TEXT PK, references auth user ID) |
| `search_impressions` | Analytics: tracks when a business appears in search results | `id` (UUID PK), `business_id` (FK), `search_query`, `created_at` |

##### PostGIS Spatial Search

The `search_nearby` function performs radius-based item search:

```sql
search_nearby(search_query TEXT, user_lat FLOAT, user_lng FLOAT, radius_km FLOAT DEFAULT 5)
```

- Joins `items` with `businesses` where `is_open = TRUE` and `subscription_status = 'active'`
- Filters by `ILIKE` pattern matching on item name
- Uses `ST_DWithin` for efficient spatial radius filtering
- Returns results ordered by distance (nearest first)
- Uses a GIST index on the `location` column for performance

##### Triggers

| Trigger | Table | Timing | Purpose |
|---------|-------|--------|---------|
| `trg_sync_business_location` | `businesses` | BEFORE INSERT/UPDATE | Auto-syncs `location` (PostGIS GEOGRAPHY) from `lat`/`lng` columns |
| `trg_protect_sensitive_business_columns` | `businesses` | BEFORE UPDATE | Prevents non-admin users from modifying `is_admin`, `subscription_status`, `subscription_expires_at`, `auth_user_id` |

##### Admin Helper Function

```sql
is_admin() RETURNS BOOLEAN  -- SECURITY DEFINER
```
Returns `TRUE` if `auth.uid()` exists in the `admins` table. Used by RLS policies across all tables.

#### Row-Level Security (RLS) Policies

RLS is enabled on **all 5 tables**. Every query goes through these policies:

##### `businesses`
| Policy | Operation | Rule |
|--------|-----------|------|
| Public can view active businesses | SELECT | `is_open = TRUE AND subscription_status = 'active'` |
| Owners can view their own business | SELECT | `auth_user_id = auth.uid() OR is_admin()` |
| Users can create their own business profile | INSERT | `auth_user_id = auth.uid()` |
| Owners can update their own business profile | UPDATE | `auth_user_id = auth.uid() OR is_admin()` |
| Admins can delete businesses | DELETE | `is_admin()` |

##### `items`
| Policy | Operation | Rule |
|--------|-----------|------|
| Public can view items of active businesses | SELECT | Business must be `is_open` and `active` |
| Owners can view their own items | SELECT | Business owner match or admin |
| Owners can insert their own items | INSERT | Business owner match or admin |
| Owners can update their own items | UPDATE | Business owner match or admin |
| Owners can delete their own items | DELETE | Business owner match or admin |

##### `subscriptions`
| Policy | Operation | Rule |
|--------|-----------|------|
| Owners can view their own subscriptions | SELECT | Via business owner match or admin |
| Admins manage subscriptions | ALL | `is_admin()` |

##### `admins`
| Policy | Operation | Rule |
|--------|-----------|------|
| Only admins can view admin list | SELECT | `is_admin()` |
| Admins can insert into admins | INSERT | `is_admin()` |

##### `search_impressions`
| Policy | Operation | Rule |
|--------|-----------|------|
| Anyone can record valid impressions | INSERT | `business_id` must reference an active, open business |
| Admins can view all impressions | SELECT | `is_admin()` |
| Businesses can view their own impressions | SELECT | Via business owner match |

#### Auth Flows

All authentication is handled by InsForge Auth:

| Flow | Method | Details |
|------|--------|---------|
| **Signup** | `insforge.auth.signUp()` | Creates auth user → triggers email OTP → `verifyEmail()` → creates `businesses` row |
| **Login** | `insforge.auth.signInWithPassword()` | Supports email directly or phone→email lookup first |
| **Logout** | `insforge.auth.signOut()` | Clears session |
| **Forgot Password** | `insforge.auth.sendResetPasswordEmail()` | Sends 6-digit code to email |
| **Reset (Code)** | `exchangeResetPasswordToken()` → `resetPassword()` | Two-step: exchange code for token, then set new password |
| **Reset (Link)** | `insforge.auth.resetPassword()` | Token from URL query param |

#### Storage

- **Bucket**: `tobli-media`
- **Path pattern**: `items/{business_id}/{item_id}.{ext}`
- **Upload flow**: Client-side compression (400KB max, 1200px max dimension) → upload via `insforge.storage.from('tobli-media').upload()`
- **Allowed types**: JPEG, PNG, WebP, GIF only (validated client-side by MIME type and extension)

#### Realtime

- **Channel**: `global_presence`
- **Event**: `heartbeat` (published every 10s per browser tab)
- **Payload**: `{ sessionId, userId }`
- **Stale cleanup**: Sessions with no heartbeat for 25s are removed from state

---

## Security

### Protections in Place

- **RLS on all tables** — No direct table access bypasses policies
- **`SECURITY DEFINER` admin check** — `is_admin()` runs with elevated privileges to safely check the `admins` table
- **Column-level protection trigger** — Non-admins cannot modify `is_admin`, `subscription_status`, `subscription_expires_at`, or `auth_user_id` on the `businesses` table
- **Admin determined server-side only** — Admin status is resolved by querying the `admins` table (not from the `businesses.is_admin` column)
- **Password strength enforcement** — 8+ characters with uppercase, lowercase, and number required
- **File upload validation** — MIME type and extension whitelist prevents malicious file uploads
- **Generic auth error messages** — Login errors do not reveal whether an account exists
- **Search impression validation** — Only valid, active business IDs can be recorded
- **`.env` in `.gitignore`** — API keys are not committed to version control
- **Parameterized queries** — All database queries use InsForge SDK (no raw SQL concatenation)

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example and fill in your InsForge project credentials:

```bash
cp .env.example .env
```

```env
VITE_INSFORGE_URL=https://your-project.region.insforge.app
VITE_INSFORGE_ANON_KEY=your_anon_key_here
```

### 3. Set up the database

Run the migrations in your InsForge SQL editor (or via CLI) **in order**:

```bash
npx insforge db import migrations/schema.sql
npx insforge db import migrations/postgis_migration.sql
npx insforge db import migrations/security_fixes.sql
```

### 4. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 5. Build for production

```bash
npm run build
npm run preview   # preview the production bundle locally
```

Deploy the generated `dist/` directory to your preferred static host.

---

## Environment Variables

| Name                      | Description                              |
|---------------------------|------------------------------------------|
| `VITE_INSFORGE_URL`      | Public URL for the InsForge project      |
| `VITE_INSFORGE_ANON_KEY` | Public anon key used by the frontend SDK |

> **Note:** `VITE_` prefixed variables are embedded in the client bundle by Vite. This is by design — the anon key is safe to expose because all data access is protected by RLS policies.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

Built with ❤️ by the Tobli team.
