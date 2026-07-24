const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    avatar: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "artist"],
      default: "user",
      required: true,
    },
    isActivated: {
      type: Boolean,
      enum: [true, false],
      default: true,
    },
    isEmailVerify: {
      type: Boolean,
      enum: [true, false],
      default: false,
    },
    is2FAOn: {
      type: Boolean,
      enum: [true, false],
      default: false,
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
