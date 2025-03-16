import user from "../Model/UserModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const LoginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const exisitnguser = await user.findOne({ email });
    if (!exisitnguser) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, exisitnguser.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // ✅ Fix: Use `exisitnguser._id` instead of `user._id`
    const token = jwt.sign(
      { id: exisitnguser._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.cookie("LoginToken", token, {
      expires: new Date(Date.now() + 60 * 60 * 1000),
      httpOnly: true,
      secure: false,
      sameSite: "none",
    });

    res.status(200).json({
      message: "Logged in successfully.",
      exisitnguser: {
        id: exisitnguser._id,
        username: exisitnguser.username,
        email: exisitnguser.email,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { LoginUser };
