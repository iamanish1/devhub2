import UserProfile from "../Model/UserProfileModel.js";
import user from "../Model/UserModel.js";

export const editUserProfile = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming user ID is stored in req.user
    const {
      user_profile_skills,
      user_profile_bio,
      user_profile_cover_photo,
      user_profile_linkedIn,
      user_profile_github,
      user_profile_website,
      user_profile_instagram,
      user_profile_location,
    } = req.body;

    // Find the user's profile
    let profile = await UserProfile.findOne({ user_name: userId });

    if (!profile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    // Update the profile fields
    profile.user_profile_skills = user_profile_skills;
    profile.user_profile_bio = user_profile_bio;
    profile.user_profile_cover_photo = user_profile_cover_photo;
    profile.user_profile_linkedIn = user_profile_linkedIn;
    profile.user_profile_github = user_profile_github;
    profile.user_profile_website = user_profile_website;
    profile.user_profile_instagram = user_profile_instagram;
    profile.user_profile_location = user_profile_location;

    // Save the updated profile
    await profile.save();

    res.status(200).json({ message: "User profile updated successfully", profile });    
} catch (error) {
    console.error("Error editing user profile:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const getUserProfile = async (req, res) => {};
