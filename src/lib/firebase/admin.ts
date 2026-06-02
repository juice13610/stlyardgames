import { App, initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

// Lazy initialization — only throws at call time, not at module import.
// This prevents Next.js build-time failures when env vars are not set.

let _app: App | undefined;

function getAdminApp(): App {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  const projectId = process.env.FB_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FB_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FB_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY."
    );
  }

  _app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket: process.env.FB_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
  return _app;
}

// Lazy proxy getters — safe to export at module level
export const adminDb = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_, prop) {
    return (getFirestore(getAdminApp()) as any)[prop];
  },
});

export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_, prop) {
    return (getAuth(getAdminApp()) as any)[prop];
  },
});

export const adminStorage = new Proxy({} as ReturnType<typeof getStorage>, {
  get(_, prop) {
    return (getStorage(getAdminApp()) as any)[prop];
  },
});
