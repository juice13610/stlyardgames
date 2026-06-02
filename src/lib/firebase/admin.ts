// Use require() so Turbopack treats firebase-admin as a CommonJS external
// and doesn't try to hash/rename it at bundle time.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require("firebase-admin");

let _initialized = false;

function getAdminApp() {
  if (_initialized) return admin.apps[0];
  if (admin.apps.length > 0) {
    _initialized = true;
    return admin.apps[0];
  }

  const projectId = process.env.FB_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FB_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FB_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || "";
  const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;
  const storageBucket = process.env.FB_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      storageBucket,
    });
  } else {
    admin.initializeApp({ projectId, storageBucket });
  }

  _initialized = true;
  return admin.apps[0];
}

export const adminDb = new Proxy({} as ReturnType<typeof admin.firestore>, {
  get(_, prop) {
    return (admin.firestore(getAdminApp()) as any)[prop];
  },
});

export const adminAuth = new Proxy({} as ReturnType<typeof admin.auth>, {
  get(_, prop) {
    return (admin.auth(getAdminApp()) as any)[prop];
  },
});

export const adminStorage = new Proxy({} as ReturnType<typeof admin.storage>, {
  get(_, prop) {
    return (admin.storage(getAdminApp()) as any)[prop];
  },
});
