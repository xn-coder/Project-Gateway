/**
 * @file Firebase configuration and initialization.
 * This file sets up the Firebase app instance and exports Firestore database service,
 * Realtime Database service (if still needed for other features, otherwise can be removed),
 * and Firebase Storage service.
 * Ensure your Firebase project credentials are set in the .env file (see .env.example).
 */
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database'; // Kept for now, can be removed if RTDB is fully unused.
import { getStorage } from 'firebase/storage';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL, 
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get a Firestore instance
const db = getFirestore(app);

// Get a Realtime Database instance (can be removed if project submissions are fully migrated to Firestore and RTDB is not used elsewhere)
const rtdb = getDatabase(app);

// Get a Storage instance (for file uploads)
const storage = getStorage(app); 

// Export the Firebase app instance, Firestore, Realtime Database (optional), and Storage services.
export { app, db, rtdb, storage };
