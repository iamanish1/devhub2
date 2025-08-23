import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

// Initialize Firebase Admin SDK (only once)
let firebaseInitialized = false;

if (!admin.apps.length) {
  try {
    // First try to use environment variables (preferred for production)
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
      firebaseInitialized = true;
      console.log("✅ Firebase Admin SDK initialized with environment variables");
    } 
    // If environment variables are not set, try to load from firebase.json file (development only)
    else {
      try {
        const firebaseConfigPath = path.join(process.cwd(), 'src', 'config', 'firebase.json');
        if (fs.existsSync(firebaseConfigPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          firebaseInitialized = true;
          console.log("✅ Firebase Admin SDK initialized with firebase.json file");
        } else {
          console.log("⚠️ Firebase environment variables not set and firebase.json not found. Firebase Admin SDK not initialized.");
          console.log("💡 To fix this, set the following environment variables:");
          console.log("   - FIREBASE_PROJECT_ID");
          console.log("   - FIREBASE_PRIVATE_KEY");
          console.log("   - FIREBASE_CLIENT_EMAIL");
          console.log("   - FIREBASE_CLIENT_ID (optional)");
          console.log("   - FIREBASE_PRIVATE_KEY_ID (optional)");
          firebaseInitialized = false;
        }
      } catch (fileError) {
        console.log("⚠️ Error reading firebase.json file:", fileError.message);
        console.log("💡 Please ensure firebase.json exists in src/config/ or use environment variables");
        firebaseInitialized = false;
      }
    }
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error.message);
    firebaseInitialized = false;
  }
} else {
  firebaseInitialized = true;
}

/**
 * Generate a Firebase Custom Token for testing
 * @param {string} uid - Unique user identifier
 * @returns {Promise<string>} - Firebase Custom Token
 */
export const generateFirebaseCustomToken = async (uid = "test-github-user") => {
  try {
    // Check if Firebase Admin is initialized
    if (!firebaseInitialized || !admin.apps.length) {
      console.log("⚠️ Firebase Admin SDK not initialized. Skipping token generation.");
      return null;
    }
    
    const customToken = await admin.auth().createCustomToken(uid);
    return customToken;
  } catch (error) {
    console.error("❌ Error generating Firebase Custom Token:", error);
    return null;
  }
};

/**
 * Verify Firebase ID Token
 * @param {string} idToken - Firebase ID Token
 * @returns {Promise<Object>} - Decoded token
 */
export const verifyFirebaseToken = async (idToken) => {
  try {
    if (!firebaseInitialized || !admin.apps.length) {
      throw new Error("Firebase Admin SDK not initialized");
    }
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("❌ Error verifying Firebase token:", error);
    throw error;
  }
};

// Export Firebase Admin instance (with safety check)
export const getFirebaseAdmin = () => {
  if (!firebaseInitialized || !admin.apps.length) {
    throw new Error("Firebase Admin SDK not initialized");
  }
  return admin;
};

// Export default admin with safety wrapper
const safeAdmin = {
  auth: () => {
    if (!firebaseInitialized || !admin.apps.length) {
      throw new Error("Firebase Admin SDK not initialized");
    }
    return admin.auth();
  },
  apps: admin.apps,
  // Add other methods as needed
};

export default safeAdmin;