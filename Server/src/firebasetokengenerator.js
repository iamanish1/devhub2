import admin from "./config/firebaseConfig.js";

async function generateFirebaseToken() {
  try {
    const customToken = await admin.auth().createCustomToken("test-uid");  
    console.log("Generated Firebase Token:", customToken);
  } catch (error) {
    console.error("Error generating token:", error);
  }
}

generateFirebaseToken();
