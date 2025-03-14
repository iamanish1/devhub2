import admin from "firebase-admin";
import { createRequire } from "module";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import dotenv from "dotenv"

dotenv.config(); // Load environment variables from.env file

const require = createRequire(import.meta.url);
const serviceAccount = require("./firebase.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Firebase Client SDK Config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY, // Replace with your Firebase API Key
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
};


// Initialize Firebase Client SDK
const clientApp = initializeApp(firebaseConfig);
const clientAuth = getAuth(clientApp);

/**
 * Generate a Firebase ID Token for testing
 * @param {string} uid - Unique user identifier
 * @returns {Promise<string>} - Firebase ID Token
 */
export const generateFirebaseIdToken = async (uid = "test-github-user") => {
  try {
    // Step 1: Generate Custom Token
    const customToken = await admin.auth().createCustomToken(uid);

    // Step 2: Exchange Custom Token for ID Token
    const userCredential = await signInWithCustomToken(clientAuth, customToken);
    const idToken = await userCredential.user.getIdToken();

    return idToken;
  } catch (error) {
    console.error("Error generating Firebase ID Token:", error);
    return null;
  }
};

// Export Firebase Admin instance
export default admin;

// Example Usage
generateFirebaseIdToken().then((token) => {
  console.log("Firebase ID Token for Testing:", token);
});
