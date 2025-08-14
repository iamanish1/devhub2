import mongoose from "mongoose";

/**
 * SavedProject Model
 * 
 * This model ensures complete user isolation:
 * - Each user can only see their own saved projects
 * - Users cannot access other users' saved projects
 * - Database queries are filtered by user ID
 * - Authentication middleware ensures user context
 * 
 * Example:
 * - User A saves Project X → Only User A sees Project X
 * - User B saves Project Y → Only User B sees Project Y
 * - User A cannot see User B's saved projects
 */
const SavedProjectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProjectListing",
    required: true,
  },
  savedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index to ensure a user can't save the same project twice
SavedProjectSchema.index({ user: 1, project: 1 }, { unique: true });

const SavedProject = mongoose.model("SavedProject", SavedProjectSchema);
export default SavedProject;
