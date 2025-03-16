import user from "../Model/UserModel.js";

const GetRegisterUser = async (req, res) => {
  try {
    // 🟢 Since `authMiddleware` attaches user data to `req.user`, we can directly use it
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    res.status(200).json(req.user); // ✅ Return user details
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export { GetRegisterUser };
