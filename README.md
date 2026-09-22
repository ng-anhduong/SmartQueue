# SmartQueue

SmartQueue is a queue-management web application for bank branches. It helps customers find a convenient branch, join a service queue remotely, and track their position while giving branch staff tools to manage counters and serve customers efficiently.

## What it demonstrates

- Customer and staff authentication with Firebase Authentication
- Real-time queue data and profiles stored in Cloud Firestore
- Branch search with location-aware Google Maps integration
- Remote queue joining, ticket tracking, leave-queue, no-show, and serving flows
- Staff setup, counter management, call-next workflows, and queue statistics
- Analytics views for branch and service performance
- Email notifications through a server-side SendGrid API handler
- Responsive Vue 3 interface with reusable components and Pinia state management

## Technology

Vue 3 · Vite · Vue Router · Pinia · Firebase Authentication · Cloud Firestore · Google Maps JavaScript API · Chart.js · SendGrid

## Getting started

### Prerequisites

- Node.js 20.19+ (or 22.12+)
- Firebase project with Authentication and Cloud Firestore enabled
- Google Maps JavaScript API key if map features are enabled

### Install and run

```sh
npm install
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead.

Fill in the values in `.env`, then start the development server:

```sh
npm run dev
```

Create a production build with:

```sh
npm run build
```

The optional seed script creates sample service-statistics documents in Firestore:

```sh
node seed.js
```

It uses the same Firebase variables from `.env`; make sure the Firebase project and Firestore rules are configured before running it.

## Environment variables

The repository includes `.env.example` as a template. The real `.env` file is intentionally ignored by Git. `VITE_EMAIL_API_URL` should point to a deployed instance of `api/sendCallNextEmail.js`. The email API itself needs `SENDGRID_API_KEY` and `FROM_EMAIL` configured in its server environment.

## Project structure

```text
src/
  components/   Reusable customer, staff, analytics, and layout components
  services/     Firebase, queue, authentication, and email service logic
  stores/       Pinia application state
  views/        Route-level pages
api/            Server-side email notification handler
public/         Static public assets
seed.js         Firestore sample-data seeding script
```

## Notes

This repository contains the application source and setup documentation. Credentials, deployment-specific configuration, generated build output, and local editor files are excluded from version control. Firebase and Google Maps keys should still be restricted in their respective consoles.
