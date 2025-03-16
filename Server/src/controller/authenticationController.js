import User from "../Model/UserModel.js"; // Capitalized model name for consistency
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const authenticateUser = async (req, res) => {
  try {
    const { username, email, password, usertype } = req.body;
    console.log(
      `User information: ${username} ${email} ${password} ${usertype}`
    );

    // Validate required fields
    if (!username || !email || !password || !usertype) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists." }); // 409 Conflict
    }

    // Check if username is already taken
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ message: "Username already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      usertype,
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Set cookie with JWT
    res.cookie("authToken", token, {
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        usertype: newUser.usertype,
      },
      token,
    });
  } catch (error) {
    console.error("Error during user authentication:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export { authenticateUser };
