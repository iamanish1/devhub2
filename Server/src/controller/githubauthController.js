import user from "../Model/UserModel.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
console.log(JWT_SECRET);

// Lazy import Firebase configuration to prevent startup failures
let admin = null;
let firebaseInitialized = false;

const initializeFirebase = async () => {
  if (!firebaseInitialized) {
    try {
      const { default: firebaseAdmin } = await import("../config/firebaseConfig.js");
      admin = firebaseAdmin;
      firebaseInitialized = true;
      console.log("✅ Firebase Admin SDK loaded successfully");
    } catch (error) {
      console.error("❌ Failed to load Firebase Admin SDK:", error.message);
      firebaseInitialized = false;
    }
  }
  return firebaseInitialized;
};

const githubAuthentication = async (req, res) => {
  try {
    const { firebasetoken } = req.body;
    if (!firebasetoken) {
      return res.status(400).json({
        error: "Missing Firebase Token",
        message: "Please provide a Firebase Token",
      });
    }
    console.log("Firebase Token:", firebasetoken);

    // Initialize Firebase if not already done
    const firebaseReady = await initializeFirebase();
    
    // Check if Firebase is available
    if (!firebaseReady || !admin || !admin.apps || !admin.apps.length) {
      return res.status(503).json({
        error: "Firebase service unavailable",
        message: "Firebase authentication is not configured. Please contact support.",
      });
    }

    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(firebasetoken);
    console.log("Decoded Token:", decodedToken);

    const { uid, email, username } = decodedToken;

    // Check if user exists
    let existingUser = await user.findOne({ githubId: uid }).exec();
    if (!existingUser) {
      existingUser = new user({
        username: username || `user_${uid}`, // Fallback to a UID-based username
        email: email || "no-email@example.com", // Default email if none provided
        githubId: uid,
        usertype: "Fresher Developer",
      });
      await existingUser.save();
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: existingUser._id,
        username: existingUser.username,
        githubId: existingUser.githubId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "GitHub Login Successful",
      user: existingUser,
      token,
    });
  } catch (error) {
    console.error("Auth Error:", error);
    
    // Check if it's a Firebase-related error
    if (error.message.includes("Firebase Admin SDK not initialized") || 
        error.message.includes("Firebase service unavailable")) {
      return res.status(503).json({
        error: "Firebase service unavailable",
        message: "Firebase authentication is not configured. Please contact support.",
      });
    }
    
    res.status(500).json({
      error: "Failed to authenticate GitHub user",
      message: error.message,
    });
  }
};

export default githubAuthentication;