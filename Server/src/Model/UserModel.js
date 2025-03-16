import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  usertype: {
    type: String,
    required: true,
    enum: ["Fresher Developer", "Junior Developer", "Senior Developer "],
    default: "fresher developer",
  },
  password: {
    type: String,
    required: function () {
      return !this.githubId;
    }, // Password required only if not using GitHub login
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true, // Allows `null` values without breaking uniqueness
  },
});

const user = mongoose.model("user", UserSchema);

export default user; // exporting the User Model for use in other files.
