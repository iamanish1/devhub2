import Bidding from "../Model/BiddingModel.js";
import ProjectListing from "../Model/ProjectListingModel.js";
import user from "../Model/UserModel.js";
import mongoose from "mongoose";

export const createBid = async (req, res) => {
  try {
    const { _id } = req.params; // projectId
    const userID = req.user._id;

    const {
      bid_amount,
      year_of_experience,
      bid_description,
      hours_avilable_per_week,
      skills,
    } = req.body;

    const project = await ProjectListing.findById(_id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const User = await user.findById(userID);
    if (!User) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingBid = await Bidding.findOne({
      project_id: _id,
      user_id: userID,
    });

    if (existingBid) {
      return res.status(400).json({
        message: "You have already placed a bid on this project",
      });
    }

    const newBid = new Bidding({
      project_id: _id,
      user_id: userID,
      bid_amount,
      year_of_experience,
      bid_description,
      hours_avilable_per_week,
      skills,
    });

    await newBid.save();
    res.status(201).json({ message: "Bid created successfully", bid: newBid });
  } catch (error) {
    console.error("Error creating bid:", error);
    res.status(500).json({ message: error.message });
  }
};
