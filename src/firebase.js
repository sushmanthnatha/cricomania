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
console.log("Firebase Config Loaded:", firebaseConfig);

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
        teamCredentials: {},
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
      console.log("🔄 Real-time update received:", docSnap.data());
      callback(docSnap.data());
    }
  });
}

/**
 * Update auction data in Firestore (merges with existing data)
 */
export async function updateAuctionData(data) {
  try {
    const auctionDocRef = doc(db, "auction", "current");
    console.log("📝 Updating Firestore:", data);
    await setDoc(auctionDocRef, {
      ...data,
      updatedAt: Date.now(),
    }, { merge: true });
    console.log("✅ Firestore update successful");
  } catch (error) {
    console.error("Error updating auction data:", error);
    throw error;
  }
}

/**
 * Sync fresh config to Firebase (completely replaces document - no merge)
 * Used when syncing TEAMS_INIT and PLAYERS_INIT to clear old data
 */
export async function syncConfigToFirebase(data) {
  try {
    const auctionDocRef = doc(db, "auction", "current");
    console.log("🔄 SYNCING CONFIG TO FIREBASE (complete replacement):", data);
    // Use merge: false to completely replace, not merge
    await setDoc(auctionDocRef, {
      ...data,
      updatedAt: Date.now(),
    }, { merge: false });
    console.log("✅ Config synced to Firebase successfully (old data cleared)");
  } catch (error) {
    console.error("❌ Error syncing config to Firebase:", error);
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
