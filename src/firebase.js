import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { getAuth, signInAnonymously, setPersistence, browserLocalPersistence } from "firebase/auth";

// ============================================================
//  FIREBASE CONFIG
//  Replace with your Firebase project credentials
//  Get these from: Firebase Console → Project Settings
// ============================================================
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDemoKeyReplace",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "cricomania-demo.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "cricomania-demo",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "cricomania-demo.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// ============================================================
//  FIRESTORE HELPERS
// ============================================================

/**
 * Initialize Firestore with auction data
 * Creates the initial auction state if it doesn't exist
 */
export async function initializeAuctionData(playersInit, teamsInit) {
  try {
    const auctionDocRef = doc(db, "auction", "current");
    const docSnap = await getDoc(auctionDocRef);

    if (!docSnap.exists()) {
      // First time setup
      await setDoc(auctionDocRef, {
        players: playersInit,
        teams: teamsInit,
        history: [],
        livePlayerId: null,
        updatedAt: Date.now(),
      });
    }
  } catch (error) {
    console.error("Error initializing auction data:", error);
  }
}

/**
 * Listen to real-time changes from Firestore
 */
export function subscribeToAuction(callback) {
  const auctionDocRef = doc(db, "auction", "current");
  return onSnapshot(auctionDocRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    }
  });
}

/**
 * Update auction data in Firestore
 */
export async function updateAuctionData(data) {
  try {
    const auctionDocRef = doc(db, "auction", "current");
    await setDoc(auctionDocRef, {
      ...data,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (error) {
    console.error("Error updating auction data:", error);
    throw error;
  }
}

/**
 * Get current auction data
 */
export async function getAuctionData() {
  try {
    const auctionDocRef = doc(db, "auction", "current");
    const docSnap = await getDoc(auctionDocRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Error getting auction data:", error);
    return null;
  }
}

/**
 * Anonymous sign-in for users
 */
export async function signInUser() {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
}
