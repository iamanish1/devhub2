import UserProfile from "../Model/UserProfileModel.js";
import user from "../Model/UserModel.js";

export const editUserProfile = async (req, res) => {
  try {
    const username = req.user?.username || req.body.username;
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

    // Find the user first
    const User = await user.findOne({ username });
    if (!User) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the user's profile
    let profile = await UserProfile.findOne({ username: User._id });

    if (!profile) {
      // If profile not found, create a new one
      profile = new UserProfile({
        username: User._id,
        user_profile_skills,
        user_profile_bio,
        user_profile_cover_photo,
        user_profile_linkedIn,
        user_profile_github,
        user_profile_website,
        user_profile_instagram,
        user_profile_location,
        user_project_contribution: 0,
        user_completed_projects: 0,
      });
    } else {
      // If profile exists, update the fields
      profile.user_profile_skills = user_profile_skills;
      profile.user_profile_bio = user_profile_bio;
      profile.user_profile_cover_photo = user_profile_cover_photo;
      profile.user_profile_linkedIn = user_profile_linkedIn;
      profile.user_profile_github = user_profile_github;
      profile.user_profile_website = user_profile_website;
      profile.user_profile_instagram = user_profile_instagram;
      profile.user_profile_location = user_profile_location;
    }

    // Save the new or updated profile
    await profile.save();

    res.status(200).json({
      message: profile.isNew
        ? "User profile created successfully"
        : "User profile updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Error editing user profile:", error);
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

import mongoose from "mongoose";

export const getUserProfile = async (req, res) => {
  try {
    console.log("Fetching profile for user:", req.user);
    const userId = req.user._id;
    console.log("User ID:", userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Invalid userId:", userId);
      return res.status(400).json({ message: "Invalid userId format" });
    }

    let profile = await UserProfile.findOne({ username: userId }).populate(
      "username",
      "-password"
    );

    console.log("Profile fetched:", profile);

    if (!profile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};
