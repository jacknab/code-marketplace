# Elite Marketplace

A Next.js 15 marketplace app for buying and selling digital assets, built with Firebase (Auth + Firestore) and Tailwind CSS.

## Architecture

- **Framework**: Next.js 15 (App Router)
- **Auth & Database**: Firebase (client SDK + Admin SDK via server-side API routes)
- **Styling**: Tailwind CSS v4 + PostCSS
- **AI**: Google Generative AI (`@google/genai`)
- **Charts**: Recharts
- **Animations**: Motion (Framer Motion)

## Key Directories

- `app/` — Next.js App Router pages and API routes
  - `app/api/listings/` — Server-side API route for creating listings (protected, requires Firebase Auth token)
  - `app/dashboard/` — Seller/developer dashboard
  - `app/products/` — Product listing pages
  - `app/login/`, `app/register/` — Auth pages
- `components/` — Shared React components (Navbar, ListingCard, FirebaseProvider, etc.)
- `lib/` — Utility modules
  - `lib/firebase.ts` — Client-side Firebase init
  - `lib/firebase-admin.ts` — Server-side Firebase Admin SDK init
  - `lib/firestore-utils.ts` — Firestore error handling helpers
  - `lib/listings.ts`, `lib/products.ts`, `lib/dashboard.ts` — Data access helpers

## Firebase Configuration

Firebase config is stored in `firebase-applet-config.json` (client-safe, public keys only).
Firebase Admin uses Application Default Credentials (ADC) — no service account key file needed.

## Running the App

```bash
npm run dev    # Dev server on port 5000
npm run build  # Production build
npm run start  # Production server on port 5000
```

## Environment Variables

See `.env.example` for required variables:
- `GEMINI_API_KEY` — Google Gemini AI API key
- `APP_URL` — The hosted URL of this app

## Replit Configuration

- Port: **5000** (required for Replit webview)
- Workflow: "Start application" → `npm run dev`
- Node version: 20
