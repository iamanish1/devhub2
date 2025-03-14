import admin from "../config/firebaseConfig.js";
import user from "../Model/UserModel.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
console.log(JWT_SECRET);

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
        usertype: "fresher developer",
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
    res.status(500).json({
      error: "Failed to authenticate GitHub user",
      message: error.message,
    });
  }
};

export default githubAuthentication;