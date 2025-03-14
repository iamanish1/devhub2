import user from "../Model/UserModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";


const authenticateUser = async (req, res) => {
  try {
    const { username, email, password, usertype } = req.body;
    console.log("user information :" + username, " "+ email, " " + password ," " + usertype);
    // Implement your logic here to authenticate user.
    if (!username || !email || !password || !usertype) {
      return res.status(400).json({ message: "All fields are required." });
    }
    //    check the user is already registered or not by email
    const existingUser = await user.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists." });
    }
    //     check the user username already created or not existing
    const existingUsername = await user.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists." });
    }
    //  Hashes the password
    const hashedPassword = await bcrypt.hash(password, 10);
    //
    const newUser = new user({
      username,
      email,
      password: hashedPassword,
      usertype: usertype,
    });
    await newUser.save();
    // Generate and send JWT
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("authToken", token, {
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      httpOnly: true,
      secure: false,
      sameSite: "none",
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
    res.status(404).json({
      message: error.message,
    });
  }
};



export {authenticateUser };
