# PGHub — PG Management System

A modern web application to manage Paying Guest (PG) accommodations efficiently.

## Features

- **Room & Bed Management** — Add, edit, and delete rooms; manage beds and track occupancy (vacant/occupied)
- **Resident Management** — Add/edit residents, assign to rooms/beds, track join and move-out dates, search/filter
- **Payments & Finance** — Track rent payments, payment modes, due dates, overdue status, and payment history
- **Notifications** — Send WhatsApp payment reminders to residents with one click
- **Dashboard** — Quick overview of total/occupied/vacant beds, active residents, and payment stats
- **Secure Authentication** — Google login via Firebase Auth

## Tech Stack

- React + TypeScript + Vite
- Firebase (Auth + Firestore)
- Material UI (MUI v7)
- React Router v6

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from `.env.example` and fill in your Firebase project credentials:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Google Authentication** under Authentication > Sign-in method
3. Enable **Firestore Database**
4. Copy your Firebase config values into the `.env` file

## Firestore Collections

| Collection  | Description                          |
|-------------|--------------------------------------|
| `rooms`     | Room data (name, beds count, floor)  |
| `beds`      | Bed data (room, status, resident)    |
| `residents` | Resident profiles and assignments    |
| `payments`  | Payment records and history          |
