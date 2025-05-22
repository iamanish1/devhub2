import Bidding from "../Model/BiddingModel.js";
import ProjectListing from "../Model/ProjectListingModel.js";
import user from "../Model/UserModel.js";
import mongoose from "mongoose";
import { firestoreDb } from "../config/firebaseAdmin.js";
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
    // update the data in the project listing
    const projectObjectId = new mongoose.Types.ObjectId(_id);
    const totalBids = await Bidding.countDocuments({
      project_id: projectObjectId,
    });
    const allBids = await Bidding.find({ project_id: projectObjectId });

    const uniqueContributors = [
      ...new Set(allBids.map((b) => b.user_id.toString())),
    ].length;

    let currentBidAmount = 0;
    if (allBids.length === 1) {
      currentBidAmount = allBids[0].bid_amount;
    } else if (allBids.length > 1) {
      currentBidAmount = allBids.reduce((sum, b) => sum + b.bid_amount, 0);
    }
    await ProjectListing.findByIdAndUpdate(projectObjectId, {
      Project_Number_Of_Bids: totalBids,
      Project_Bid_Amount: currentBidAmount,
    });

    // sync the data to the firebase fire store
    await firestoreDb
      .collection("project_summaries")
      .doc(String(projectObjectId))
      .set(
        {
          current_bid_amount: currentBidAmount,
          total_bids: totalBids,
          number_of_contributors: uniqueContributors,
          updated_at: new Date(),
        },
        { merge: true } // This will create the document if it doesn't exist
      );

    console.log("Firebase Sync Data:", {
      total_bids: totalBids,
      number_of_contributors: uniqueContributors,
      current_bid_amount: currentBidAmount,
    });

    res.status(201).json({ message: "Bid created successfully", bid: newBid });
  } catch (error) {
    console.error("Error creating bid:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getBid = async (req, res) => {
  try {
    const { _id } = req.params; // projectId
    const userID = req.user._id;

    const existingBid = await Bidding.findOne({
      project_id: _id,
      user_id: userID,
    });

    if (!existingBid) {
      return res.status(404).json({ message: "Bid not found" });
    }

    res.status(200).json({
      message: "Bid fetched successfully",
      existingBid,
    });
  } catch (error) {
    console.error("Error fetching bid:", error);
    res.status(500).json({ message: error.message });
  }
};
