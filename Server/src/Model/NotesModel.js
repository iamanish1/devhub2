import mongoose from "mongoose";
import Projectlisting from "./ProjectListingModel.js";

const userNoteSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Projectlisting", required: true },
    notes: { type: [String], default: [] },
});
const UserNote = mongoose.model("UserNote", userNoteSchema);

export default UserNote;
 