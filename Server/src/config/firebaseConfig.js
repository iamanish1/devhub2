import admin from "firebase-admin";
import { createRequire } from "module";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";

const require = createRequire(import.meta.url);
const serviceAccount = require("./firebase.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Firebase Client SDK Config
const firebaseConfig = {
  apiKey: "AIzaSyDv0D4PmCm2xztSIPWV3t_uuoExUXwH6LU", // Replace with your Firebase API Key
  authDomain: "devhubs-project.firebaseapp.com",
  projectId: "devhubs-project",
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
