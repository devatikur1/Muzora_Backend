const userModel = require("../models/user.model");
const { sendOtpEmail } = require("../services/email.service");
const generateOtp = require("./generateOtp");
const jwt = require("jsonwebtoken");

//🔹 Send OTP Fn
async function sendOtpFn(data, purpose, res) {
  try {
    if (!data.email || !purpose) {
      return res.status(400).json({
        status: 400,
        message: "User Data and purpose are required",
      });
    }
    const otp = generateOtp();
    res.clearCookie("otpToken");

    const otpToken = jwt.sign(
      { data, otp, purpose },
      process.env.OTP_TOKEN_SECRET,
      { expiresIn: process.env.OTP_EXPIRES_IN },
    );
    res.cookie("otpToken", otpToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: parseInt(process.env.OTP_EXPIRES_IN) * 60 * 1000,
    });
    
    await sendOtpEmail(data.email, otp);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Otp sending failed, pls try again",
    });
  }
}

// 🔹 Verify OTP Fn
async function finalizeOtpVerification(data, purpose, res) {
  try {
    if (!data.email || !purpose)
      return res.status(400).json({
        status: 400,
        message: "Email and purpose are required",
      });

    const user = await userModel
      .findOne({ email: data.email })
      .select("+password");
    if (!user) {
      return { status: 404, message: "User not found" };
    }

    switch (purpose) {
      case "register":
      case "login":
        const accessToken = jwt.sign(
          { userId: user._id },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN },
        );

        const refreshToken = jwt.sign(
          { userId: user._id },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN },
        );

        res.cookie("accessToken", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN) * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN) * 60 * 1000,
        });

        user.isVerified = true;
        user.refreshToken = refreshToken;
        await user.save();
        break;
      case "reset-password":
        break;
      case "2fa":
        break;
      case "update-email":
        break;
      case "update-password":
        user.password = data.newPassword;
        await user.save();
        break;
      default:
        return res.status(400).json({ message: "Invalid OTP purpose" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Otp verification failed, pls try again",
    });
  }
}

module.exports = { sendOtpFn, finalizeOtpVerification };
