import mongoose from "mongoose";
import Projectlisting from "./ProjectListingModel.js";
import user from "./UserModel.js";

const userNoteSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Projectlisting",
    required: true,
  },
  notes: [
    {
      text: { type: String, required: true },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const UserNote = mongoose.model("UserNote", userNoteSchema);
export default UserNote;
