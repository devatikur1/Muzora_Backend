const { sendOtpEmail } = require("../services/email.service");
const generateOtp = require("../utils/generateOtp");
const otpModel = require("../models/otp.model");
const userModel = require("../models/user.model");

//🔹 Send otp Fn
async function sendOtp(req, res) {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res
        .status(400)
        .json({ message: "Email and purpose are required" });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await otpModel.deleteMany({ email, purpose });
    await otpModel.create({ email, otp, purpose, expiresAt });

    await sendOtpEmail(email, otp);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

//🔹 verify otp Fn
async function verifyOtp(req, res) {
  try {
    const { email, otp, purpose } = req.body;

    const oldOtp = await otpModel.findOne({ email, otp, purpose });

    if (!oldOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await otpModel.deleteOne({ _id: oldOtp._id });

    if (purpose === "register") {
      await userModel.findOneAndUpdate({ email }, { isEmailVerify: true });
    }

    if (purpose === "login") {
      await userModel.findOneAndUpdate({ email }, { isActivated: true });
    }

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

module.exports = { sendOtp, verifyOtp };
