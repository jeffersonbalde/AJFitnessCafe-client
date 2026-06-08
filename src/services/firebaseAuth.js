import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let firebaseApp = null;
let firebaseAuth = null;
let googleProvider = null;

function ensureFirebase() {
  if (!firebaseApp) {
    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.appId) {
      throw new Error("Firebase config is missing. Check your client .env values.");
    }
    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
  }
}

export async function signInWithGoogleToken() {
  ensureFirebase();
  const credential = await signInWithPopup(firebaseAuth, googleProvider);
  const idToken = await credential.user.getIdToken();
  return {
    idToken,
    email: credential.user.email ?? null,
    name: credential.user.displayName ?? null,
  };
}

