const userModel = require("../models/user.model.js");
const { cleanObject } = require("../utils/cleanData.js");
const { sendOtpFn, finalizeOtpVerification } = require("../utils/otp.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

//🔹 Register User Fn
async function register(req, res) {
  try {
    const { username, fullName, email, password, role = "user" } = req.body;

    if (!username || !fullName || !email || !password) {
      return res
        .status(400)
        .json({
          message:"Please fill in all fields"
        });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    const isUserAlreadyExists = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (isUserAlreadyExists) {
      const field = isUserAlreadyExists.email === email ? "Email" : "Username";
      return res.status(409).json({ message: `${field} already in use` });
    }

    const hash = await bcrypt.hash(password, 10);
    const avatar = `https://ui-avatars.com/api/?name=${username}&background=random&color=fff&size=256`;

    const user = await userModel.create({
      username,
      fullName,
      avatar,
      email,
      password: hash,
      role,
    });
    console.log("User created:", user);
    await sendOtpFn(cleanObject(user, ["password"]), "register", res);

    return res.status(201).json({
      message: "Registration successfully, OTP sent to email",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}

//🔹 Log-in User Fn
async function login(req, res) {
  try {
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

    await sendOtpFn(cleanObject(user), "login", res);
    return res.status(200).json({
      message: "OTP sent successfully, please verify to complete login",
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
}

//🔹 Log-out User Fn
async function logout(req, res) {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await userModel.findByIdAndUpdate(decoded.id, { refreshToken: null });
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res
      .status(200)
      .json({ message: "Something went wrong", error: error.message });
  }
}

//🔹 Refresh Token Fn
async function refreshToken(req, res) {
  try {
    const token = req.cookies.refreshToken;
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await userModel.findById(decoded.id).select("role");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ message: "Token refreshed successfully" });
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
  }
}

//🔹 Get current user
async function getMe(req, res) {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User fetched successfully",
      user: cleanObject(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
}

//🔹 Change password
async function changePassword(req, res) {
  try {
    const { oldPass, newPass } = req.body;

    if (!oldPass || !newPass) {
      return res
        .status(400)
        .json({ message: "Old and new password are required" });
    }

    const user = await userModel.findById(req.user.id).select("+password");
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

// 🔹 Verify OTP Fn
async function verifyOtp(req, res) {
  try {
    const userSentOtp = req.body.otp;
    const otpToken = req.cookies.otpToken;

    if (!userSentOtp || !otpToken) {
      return res.status(400).json({ message: "OTP and token are required" });
    }

    const decoded = jwt.verify(otpToken, process.env.OTP_TOKEN_SECRET);
    if (!decoded) {
      return res.status(400).json({ message: "Invalid or expired OTP token" });
    }

    if (decoded.otp !== userSentOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    await finalizeOtpVerification(decoded.data, decoded.purpose, res);

    res.clearCookie("otpToken");
    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}

// 🔹 Resend Otp FN
async function resendOtp(req, res) {
  try {
    const otpToken = req.cookies.otpToken;

    if (!otpToken) {
      return res.status(400).json({ message: "OTP token is required" });
    }

    const decoded = jwt.verify(otpToken, process.env.OTP_TOKEN_SECRET, {
      ignoreExpiration: true,
    });

    await sendOtpFn(
      cleanObject(decoded.data, ["password"]),
      decoded.purpose,
      res,
    );

    return res.status(200).json({
      status: 200,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Otp sending failed, please try again",
    });
  }
}

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  changePassword,
  verifyOtp,
  resendOtp,
};
