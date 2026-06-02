import { App, initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

let _app: App | undefined;

function getAdminApp(): App {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  const projectId = process.env.FB_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FB_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FB_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || "";
  const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;
  const storageBucket = process.env.FB_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (projectId && clientEmail && privateKey) {
    _app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket,
    });
  } else {
    _app = initializeApp({ projectId, storageBucket });
  }
  return _app;
}

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
