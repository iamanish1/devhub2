import UserProfile from "../Model/UserProfileModel.js";
import user from "../Model/UserModel.js";

export const editUserProfile = async (req, res) => {
  try {
    const username = req.user?.username || req.body.username; // Assuming user ID is stored in req.user
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

    const User = await user.findOne({ username });
    if (!User) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the user's profile
    let profile = await UserProfile.findOne({ user_name: user._id });

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

    res
      .status(200)
      .json({ message: "User profile updated successfully", profile });
  } catch (error) {
    console.error("Error editing user profile:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const username = req.user?.username || req.body.username;

    // 1. Find the user by username
    const User = await user.findOne({ username });
    if (!User) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Find the user's profile by user ObjectId
    let profile = await UserProfile.findOne({ user_name: User._id }).populate(
      "user_name"
    );

    // 3. If not found, return error (do NOT create)
    if (!profile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

// Update profile controller

export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
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

    res
      .status(200)
      .json({ message: "User profile updated successfully", profile });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};
