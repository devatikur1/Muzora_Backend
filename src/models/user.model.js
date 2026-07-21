const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: { type: String, required: true },
  avatar: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: String,
  },
  role: {
    type: String,
    enum: ["user", "artist"],
    default: "user",
    required: true,
  },
});

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;