/**
 * @file Firebase configuration and initialization.
 * This file sets up the Firebase app instance and exports Firestore database service.
 * Ensure your Firebase project credentials are set in the .env file (see .env.example).
 */
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// import { getStorage } from 'firebase/storage'; // Uncomment if you plan to use Firebase Storage for file uploads

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
// This ensures that Firebase is initialized only once.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get a Firestore instance
const db = getFirestore(app);

// Get a Storage instance (Uncomment if you need Firebase Storage for file uploads)
// const storage = getStorage(app); 

// Export the Firebase app instance and Firestore database service.
// Export storage if you uncomment its initialization above.
export { app, db /*, storage */ };
