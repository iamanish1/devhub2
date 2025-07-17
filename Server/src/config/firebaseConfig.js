import admin from "firebase-admin";
import { createRequire } from "module";
import dotenv from "dotenv";

dotenv.config();

const require = createRequire(import.meta.url);
const serviceAccount = require("./firebase.json");

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/**
 * Generate a Firebase Custom Token for testing
 * @param {string} uid - Unique user identifier
 * @returns {Promise<string>} - Firebase Custom Token
 */
export const generateFirebaseCustomToken = async (uid = "test-github-user") => {
  try {
    const customToken = await admin.auth().createCustomToken(uid);
    return customToken;
  } catch (error) {
    console.error("Error generating Firebase Custom Token:", error);
    return null;
  }
};

// Export Firebase Admin instance
export default admin;

// Example Usage
generateFirebaseCustomToken().then((token) => {
  console.log("Firebase Custom Token for Testing:", token);
});