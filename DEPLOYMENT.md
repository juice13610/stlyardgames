# STL Yard Games — Deployment Guide

## Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project (Blaze/pay-as-you-go plan required for hosting with Next.js)

---

## 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → New Project → name it `stlyardgames`
2. Enable **Firestore** (Native mode, us-central1)
3. Enable **Firebase Auth** → Sign-in method → Google
4. Enable **Storage**
5. Enable **Hosting**

### Get your Firebase config

Console → Project Settings → Your Apps → Add web app → copy the config object.

---

## 2. Firebase Admin Service Account

Console → Project Settings → Service Accounts → Generate new private key → download JSON.

You'll need from this file:
- `project_id`
- `client_email`
- `private_key`

---

## 3. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

**Client-side (safe to expose):**
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_APP_URL=https://stlyardgames.com
```

**Server-side (never expose):**
```
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
CONNECTEAM_API_KEY=
CONNECTEAM_SCHEDULER_ID=
GOOGLE_MAPS_API_KEY=
RESEND_API_KEY=
QBO_CLIENT_ID=
QBO_CLIENT_SECRET=
QBO_SANDBOX=true
```

---

## 4. Firestore Indexes & Rules

```bash
firebase login
firebase use --add   # select your stlyardgames project
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 5. Deploy to Firebase Hosting (with Next.js)

Firebase Hosting now supports Next.js natively via App Hosting or Web Frameworks.

```bash
firebase experiments:enable webframeworks
firebase deploy --only hosting
```

Firebase detects Next.js automatically and deploys it correctly (SSR, API routes, static pages).

---

## 6. Custom Domain (stlyardgames.com)

Firebase Console → Hosting → Add custom domain → follow DNS instructions.

---

## 7. Admin Portal Access

The admin portal is at `/admin`. Only `joeytomsfbr@gmail.com` can sign in.

To add additional admins, edit two places:
- `src/lib/firebase/auth-context.tsx` → `ALLOWED_EMAILS` array
- `firestore.rules` → add email to the allowlist

---

## 8. Connecteam Setup

1. Log into Connecteam as admin
2. Go to Admin → Scheduling — note the Scheduler ID from the URL
3. Generate an API key: Admin → Settings → API
4. Enter both in Admin → Settings on the website

---

## 9. QuickBooks Online Setup

1. Create an app at [developer.intuit.com](https://developer.intuit.com)
2. Add redirect URI: `https://stlyardgames.com/api/qbo/callback`
3. Copy Client ID and Client Secret → Admin → Settings on the website
4. Click "Connect QuickBooks" button in admin settings to authorize

---

## 10. Google Maps API

1. [Google Cloud Console](https://console.cloud.google.com) → APIs → Enable **Distance Matrix API**
2. Create an API key → restrict to your domain
3. Add to `.env.local` as `GOOGLE_MAPS_API_KEY`

---

## 11. Email (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain `stlyardgames.com`
3. Create an API key → add to `.env.local` as `RESEND_API_KEY`

---

## 12. Game Images

Game images are referenced at `/images/games/{slug}-1.jpg`. Until real photos are added, the image areas will show empty (broken image). 

**To add images:**
1. Get product photos (photograph your actual equipment)
2. Optimize: resize to max 800×600, save as JPEG at 80% quality
3. Place in `public/images/games/`:
   - `putterball-1.jpg`
   - `cornhole-1.jpg`
   - `washer-toss-1.jpg`
   - `ladder-ball-1.jpg`
   - `giant-jenga-1.jpg`
   - `giant-connect-four-1.jpg`

---

## 13. Firestore Schema Summary

```
reservations/{id}
  customerName, email, phone
  pickupDate, pickupTime, returnDate, returnTime, rentalHours
  deliveryType, deliveryMiles, deliveryFee, deliveryTotal
  items[{inventoryId, displayName, quantity, unitPrice, discountPct, lineTotal}]
  subtotal, discountTotal, grandTotal
  status: inquiry|pending_contract|contract_sent|contract_signed|invoiced|paid|completed|cancelled
  connecteamShiftIds: {main: "shiftId"}
  contractId, contractSignedAt
  qboInvoiceId, qboInvoiceUrl, qboDocNumber
  eventNotes, eventAddress
  createdAt, updatedAt

contracts/{id}
  reservationId
  customNotes
  signedAt, signerName
  createdAt

settings/integrations
  connecteamSchedulerId
  qboSandbox

settings/qbo
  realmId, accessToken, refreshToken, expiresAt, connected, sandbox
```

---

## Workflow Summary

```
Customer fills out /book form
  → POST /api/reservations
    → Firestore reservation (status: inquiry)
    → Connecteam draft shift created (unpublished)
    → Confirmation email to customer
    → Notification email to joeytomsfbr@gmail.com

Admin reviews in /admin/reservations
  → Clicks "Book It — Send Contract"
    → POST /api/contracts
      → Firestore contract created
      → Contract email sent to customer (with signing link)
      → Reservation status → contract_sent

Customer signs at /contract/{contractId}
  → POST /api/contracts/{id}/sign
    → Contract marked signed
    → Reservation status → contract_signed
    → Connecteam shift PUBLISHED (staff notified)

Admin creates invoice in reservation detail
  → POST /api/qbo/invoices
    → QuickBooks invoice created
    → Invoice emailed to customer
    → Reservation status → invoiced

Customer pays → admin marks paid manually in admin portal
```
