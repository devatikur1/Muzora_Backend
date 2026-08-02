const userModel = require("../models/user.model");
const { sendOtpEmail } = require("../services/email.service");
const generateOtp = require("./generateOtp");
const jwt = require("jsonwebtoken");
const { sendError } = require("./sendError.js");

//🔹 Send OTP Fn
async function sendOtp(data, purpose, res) {
  try {
    if (!data || !data.email || !purpose) {
      sendError(res, "auth/missing-fields");
      return false;
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
      maxAge: parseInt(process.env.OTP_EXPIRES_IN, 10) * 60 * 1000,
    });

    await sendOtpEmail(data.email, otp);
    return true;
  } catch (error) {
    console.log(error);
    sendError(res, "auth/server-error");
    return false;
  }
}

// 🔹 Finalize OTP Verification
async function finalizeOtpVerification(data, purpose, res) {
  try {
    if (!data || !data.email || !purpose) {
      sendError(res, "auth/missing-fields");
      return false;
    }

    const user = await userModel
      .findOne({ email: data.email })
      .select("+password");

    if (!user) {
      sendError(res, "auth/user-not-found");
      return false;
    }

    switch (purpose) {
      case "register":
      case "login":
        const accessToken = jwt.sign(
          { id: user._id, role: user.role },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN },
        );

        const refreshToken = jwt.sign(
          { id: user._id },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN },
        );

        res.cookie("accessToken", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN, 10) * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge:
            parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN, 10) * 60 * 1000,
        });

        user.isVerified = true;
        user.refreshToken = refreshToken;
        await user.save();
        return user;
      case "reset-password":
        const resetToken = jwt.sign(
          { id: user._id },
          process.env.RESET_TOKEN_SECRET,
          { expiresIn: process.env.RESET_TOKEN_EXPIRES_IN },
        );

        res.cookie("resetToken", resetToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: parseInt(process.env.RESET_TOKEN_EXPIRES_IN, 10) * 60 * 1000,
        });
        return true;
      case "update-email":
        user.email = data.newEmail;
        await user.save();
        return user;
        break;
      case "update-password":
        user.password = data.newPassword;
        await user.save();
        return user;
      default:
        sendError(res, "auth/invalid-otp-purpose");
        return false;
    }
  } catch (error) {
    console.log(error);
    sendError(res, "auth/server-error");
    return false;
  }
}

module.exports = { sendOtp, finalizeOtpVerification };
