import UserProfile from "../Model/UserProfileModel.js";
import user from "../Model/UserModel.js";

export const editUserProfile = async (req, res) => {
  try {
     
    

  } catch (error) {
    console.error("Error editing user profile:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const getUserProfile = async (req, res) => {};
