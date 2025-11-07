import admin from 'firebase-admin';

let initialized = false;
let initError = null;

export function initFirebaseAdmin() {
  if (initialized) return admin;

  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY
  } = process.env;

  try {
    if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
      const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey
        })
      });
    } else {
      // Fallback to ADC (GOOGLE_APPLICATION_CREDENTIALS or environment-provided)
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
    }
    initialized = true;
    initError = null;
  } catch (err) {
    initError = err;
    // Defer throwing to the middleware so server can still boot
  }

  return admin;
}

export function getFirebaseInitError() {
  return initError;
}


