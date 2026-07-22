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

  const avatar = `https://ui-avatars.com/api/?name=${username}&background=random&color=fff&size=256`;

  const user = await userModel.create({
    username,
    fullName,
    avatar,
    email,
    password: hash,
    role,
    isActivated: true,
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

  const user = await userModel.findOne({
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

//🔹 Edit data of current user
// async function editUserData(req, res) {
//   const { username, fullName, avatar } = req.body;

//   const updateData = {};
//   if (username) updateData.username = username;
//   if (fullName) updateData.fullName = fullName;
//   if (avatar) updateData.avatar = avatar;

//   const user = await userModel.findByIdAndUpdate({ _id: req.user.id }, {});
// }

//🔹 Change password
async function changePassword(req, res) {
  try {
    const { oldPass, newPass } = req.body;

    if (!oldPass || !newPass) {
      return res
        .status(400)
        .json({ message: "Old and new password are required" });
    }

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isOldPassValid = await bcrypt.compare(oldPass, user.password);
    if (!isOldPassValid) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    const isSameAsOld = await bcrypt.compare(newPass, user.password);
    if (isSameAsOld) {
      return res
        .status(400)
        .json({ message: "New password must be different from old password" });
    }

    const newHash = await bcrypt.hash(newPass, 10);

    user.password = newHash;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

//🔹 Login User Fn
async function logOutUser(req, res) {
  res.clearCookie("token");
  res.status(200).json({ message: "User logged out successfully" });
}

//🔹 Delete Account Fn
async function deleteAccount(req, res) {
  const { password };
}

module.exports = {
  registerUser,
  loginUser,
  logOutUser,
  getCurrentUser,
  changePassword,
  deleteAccount,
};
