import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

const serviceAccountKey = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
);

export const firebaseAdminApp = 
  getApps().length === 0 
    ? initializeApp({
        credential: cert(serviceAccountKey),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      })
    : getApps()[0];

export const firebaseAdminAuth = getAuth(firebaseAdminApp);
export const firebaseAdminDb = getDatabase(firebaseAdminApp);
