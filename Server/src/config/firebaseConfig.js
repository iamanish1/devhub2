// src/config/firebaseAdmin.js
import admin from "firebase-admin";

// ---- helpers ---------------------------------------------------------------
function parseServiceAccountFromEnv() {
  // Highest priority: a single JSON blob in FIREBASE_SERVICE_ACCOUNT
  const blob = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (blob) {
    try {
      const parsed = JSON.parse(blob);
      // Normalize private_key newlines if needed
      if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      return parsed;
    } catch (e) {
      console.error("FIREBASE_SERVICE_ACCOUNT is not valid JSON:", e.message);
    }
  }

  // Next: individual vars (often used on Railway)
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return {
      type: "service_account",
      project_id: FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "",
      private_key: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      client_email: FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID || "",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${FIREBASE_CLIENT_EMAIL}`,
    };
  }

  return null;
}

// ---- initialization --------------------------------------------------------
let firebaseInitialized = false;

if (!admin.apps.length) {
  try {
    const sa = parseServiceAccountFromEnv();

    if (sa) {
      admin.initializeApp({ credential: admin.credential.cert(sa) });
      firebaseInitialized = true;
      console.log("✅ Firebase Admin initialized from environment");
    } else if (process.env.NODE_ENV !== "production") {
      // Dev-only fallback to local file
      // (avoid shipping secrets in repo; this is for local dev convenience)
      const { readFileSync, existsSync } = await import("fs");
      const { default: path } = await import("path");
      const devPath = path.resolve(process.cwd(), "src", "config", "firebase.json");
      if (existsSync(devPath)) {
        const localSA = JSON.parse(readFileSync(devPath, "utf8"));
        if (localSA.private_key) localSA.private_key = localSA.private_key.replace(/\\n/g, "\n");
        admin.initializeApp({ credential: admin.credential.cert(localSA) });
        firebaseInitialized = true;
        console.log("✅ Firebase Admin initialized from src/config/firebase.json (DEV)");
      } else {
        console.warn("⚠️ No Firebase credentials found (env or file). Admin not initialized.");
      }
    } else {
      console.error("❌ No Firebase credentials in env (and file fallback disabled in production).");
    }
  } catch (err) {
    console.error("❌ Failed to initialize Firebase Admin:", err);
    firebaseInitialized = false;
  }
} else {
  firebaseInitialized = true;
}

// ---- exports ---------------------------------------------------------------
export const getFirebaseAdmin = () => {
  if (!firebaseInitialized || !admin.apps.length) throw new Error("Firebase Admin SDK not initialized");
  return admin;
};

export const generateFirebaseCustomToken = async (uid = "test-github-user") => {
  if (!firebaseInitialized || !admin.apps.length) return null;
  try {
    return await admin.auth().createCustomToken(uid);
  } catch (e) {
    console.error("Error creating custom token:", e);
    return null;
  }
};

export const verifyFirebaseToken = async (idToken) => {
  if (!firebaseInitialized || !admin.apps.length) throw new Error("Firebase Admin SDK not initialized");
  return admin.auth().verifyIdToken(idToken);
};

export default {
  auth: () => getFirebaseAdmin().auth(),
  apps: admin.apps,
};
