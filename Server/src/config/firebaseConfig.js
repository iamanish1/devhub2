import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  // Check if Firebase environment variables are set
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "",
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID || "",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    console.log("Firebase environment variables not set. Firebase Admin SDK not initialized.");
  }
}

/**
 * Generate a Firebase Custom Token for testing
 * @param {string} uid - Unique user identifier
 * @returns {Promise<string>} - Firebase Custom Token
 */
export const generateFirebaseCustomToken = async (uid = "test-github-user") => {
  try {
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      console.log("Firebase Admin SDK not initialized. Skipping token generation.");
      return null;
    }
    
    const customToken = await admin.auth().createCustomToken(uid);
    return customToken;
  } catch (error) {
    console.error("Error generating Firebase Custom Token:", error);
    return null;
  }
};

// Export Firebase Admin instance
export default admin;

// Example Usage (only if Firebase is configured)
if (process.env.FIREBASE_PROJECT_ID) {
  generateFirebaseCustomToken().then((token) => {
    if (token) {
      console.log("Firebase Custom Token for Testing:", token);
    }
  });
}