# PGHub — Paying Guest Management System

A full-featured web application for managing Paying Guest (PG) accommodations. Built with React, TypeScript, Vite, Tailwind CSS, and Firebase.

## Features

- **Room & Bed Management** — Add/edit/delete rooms, configure beds, track occupancy (vacant/occupied) with a visual per-room overview
- **Resident Management** — Add residents, assign them to specific beds, store ID proof, contact details, join/move-out dates; search and filter by name, room, or status
- **Payments & Finance** — Record rent payments (monthly, advance, other), filter by month/resident/type, view payment status for all active residents, download text receipts
- **Dashboard** — At-a-glance stats (total beds, occupied, vacant, revenue, pending payments), room occupancy progress bars, resident activity (new joiners, leavers)
- **Notifications** — WhatsApp deep-link button on every resident card
- **Auth** — Google Sign-In via Firebase Auth; demo mode available without credentials

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Auth + DB | Firebase (Auth + Firestore) |

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd PGHub
npm install
```

### 2. Configure Firebase

Copy `.env.example` to `.env` and fill in your Firebase project credentials:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> **No Firebase credentials?** Click **"Try Demo"** on the login page — the app runs fully in-browser using `localStorage` with sample data.

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:5173

### 4. Build for production

```bash
npm run build
```

## Firebase Setup (for real deployment)

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication → Google** sign-in provider
3. Enable **Firestore Database** (start in test mode, then add security rules)
4. Copy the web app config values into your `.env` file

## Project Structure

```
src/
├── App.tsx                  # Root with routing
├── main.tsx                 # Entry point
├── index.css                # Tailwind imports
├── vite-env.d.ts            # Vite env type declarations
├── firebase/
│   └── config.ts            # Firebase initialization
├── contexts/
│   └── AuthContext.tsx      # Auth state + Google sign-in
├── types/
│   └── index.ts             # Shared TypeScript types
├── hooks/
│   ├── useRooms.ts          # Room & bed state (localStorage)
│   ├── useResidents.ts      # Resident state (localStorage)
│   └── usePayments.ts       # Payment state (localStorage)
├── components/
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── ProtectedLayout.tsx  # Auth guard + layout
│   ├── StatCard.tsx         # Dashboard stat card
│   └── Modal.tsx            # Reusable modal dialog
├── pages/
│   ├── Login.tsx            # Google sign-in + demo login
│   ├── Dashboard.tsx        # Overview & stats
│   ├── Rooms.tsx            # Room & bed management
│   ├── Residents.tsx        # Resident management
│   ├── Payments.tsx         # Payment tracking
│   ├── rooms/
│   │   └── RoomForm.tsx     # Add/edit room form
│   ├── residents/
│   │   └── ResidentForm.tsx # Add/edit resident form
│   └── payments/
│       └── PaymentForm.tsx  # Record payment form
└── utils/
    └── dateUtils.ts         # Date formatting helpers
```

## Data Storage

In demo mode (no Firebase), all data is stored in **localStorage** and pre-loaded with sample rooms and residents so you can explore immediately.

To migrate to Firestore, replace the hook implementations in `src/hooks/` with Firestore queries — the hook interfaces remain the same.
