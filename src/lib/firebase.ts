import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigFallback from '../../firebase-applet-config.json';

// Construct configuration using environment variables if defined, falling back to static config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigFallback.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'caseedge.in',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigFallback.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigFallback.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigFallback.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigFallback.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigFallback.measurementId || '',
};

const app = initializeApp(firebaseConfig);

const dbId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || (firebaseConfigFallback as any).firestoreDatabaseId;
export const db = getFirestore(app, dbId);
export const auth = getAuth(app);

