const userModel = require("../models/user.model");
const { cleanObject } = require("../utils/cleanData");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

//🔹 Register User Fn
async function registerUser(req, res) {
  const { username, fullName, email, password, role = "user" } = req.body;

  const isUserAlreadyExists = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  const hash = await bcrypt.hash(password, 10);

  if (isUserAlreadyExists) {
    return res.status(409).json({ message: "User already exists" });
  }

  const user = await userModel.create({
    username,
    fullName,
    email,
    password: hash,
    role,
  });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
  );

  res.cookie("token", token);

  res.status(201).json({
    message: "User registered successfully",
    user: cleanObject(user, ["password"]),
  });
}

//🔹 Login User Fn
async function loginUser(req, res) {
  const { username, email, password } = req.body;

  const user = await userModel
    .findOne({
      $or: [{ username }, { email }],
    });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
  );

  res.cookie("token", token);

  res.status(201).json({
    message: "User logged in successfully",
    user: cleanObject(user, ["password"]),
  });
}

//🔹 Get current user
async function getCurrentUser(req, res) {
  const user = await userModel.findById(req.user.id).select("-password");

  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  res.status(200).json({
    message: "User fetched successfully",
    user: cleanObject(user),
  });
}

//🔹 Login User Fn
async function logOutUser(req, res) {
  res.clearCookie("token");
  res.status(200).json({ message: "User logged out successfully" });
}

module.exports = { registerUser, loginUser, logOutUser, getCurrentUser };
