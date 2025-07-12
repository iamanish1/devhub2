import ProjectListing from "./ProjectListingModel.js";
import user from "./UserModel.js";
import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Projectlisting",
    required: true,
  },

  senderID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});


const Chat = mongoose.model("chat", chatSchema);

export default Chat; // Exporting the Chat Model for use in other files.