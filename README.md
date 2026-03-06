# PGHub — PG Management System

A comprehensive web application for managing Paying Guest (PG) accommodations. Built with **React + TypeScript + Firebase + Tailwind CSS**.

## Features

### 🏠 Room & Bed Management
- Add, edit, and delete rooms with floor information
- Automatically create beds when adding a room
- Manually add or remove individual beds
- Visual occupancy status tracking (vacant/occupied)

### 👥 Resident (Tenant) Management
- Add, edit, and remove resident profiles
- Store: name, phone, email, alternate contact, ID proof, address
- Assign residents to a specific room and bed
- Track join date and move-out dates
- Filter by name, room, or status (active/moved out)
- Detailed resident view

### 💳 Payments & Finance Tracking
- Record rent and other payments (advance, other charges)
- Supports multiple payment modes: Cash, UPI, Online, Bank Transfer, Cheque
- Track paid/unpaid/overdue status
- Auto-populate rent amount from resident's profile
- Mark payments as paid with one click
- View and print payment receipts
- Summary stats: total collected, pending, overdue

### 🔔 Notifications & Automation
- Send WhatsApp messages directly via wa.me links
- Auto-generate payment reminder messages
- Welcome messages for new residents
- Move-out farewell messages
- Custom message composer
- Bulk overdue payment reminders
- Notification history log

### 📊 Dashboard
- Total beds, occupied, vacant count
- Active residents count
- Payments summary (paid this month, pending)
- Total revenue
- Recent payments and residents list

### 🔐 Authentication
- Email/password login
- Google Sign-In
- Firebase Auth integration

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| Backend/DB | Firebase Firestore |
| Auth | Firebase Authentication |
| Icons | Lucide React |
| Date handling | date-fns |

## Setup

### 1. Clone the repository
```bash
git clone <repo-url>
cd PGHub
npm install
```

### 2. Configure Firebase

Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com), then:
- Enable **Firestore Database**
- Enable **Authentication** (Email/Password + Google)
- Copy your Firebase config

Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

Fill in your Firebase credentials in `.env`:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Firestore Security Rules

In your Firebase Console → Firestore → Rules, set:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Run the app
```bash
npm run dev
```

Visit `http://localhost:5173`

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   └── common/          # Shared UI components (Modal, Layout, etc.)
├── context/
│   └── AuthContext.tsx  # Firebase Auth context
├── pages/               # Route-level page components
│   ├── DashboardPage.tsx
│   ├── LoginPage.tsx
│   ├── NotificationsPage.tsx
│   ├── PaymentsPage.tsx
│   ├── ResidentsPage.tsx
│   └── RoomsPage.tsx
├── services/
│   ├── db.ts            # Firestore CRUD operations
│   └── firebase.ts      # Firebase initialization
├── types/
│   └── index.ts         # TypeScript type definitions
└── utils/
    └── helpers.ts       # Utility functions
```
