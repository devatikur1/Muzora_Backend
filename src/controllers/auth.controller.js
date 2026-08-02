const { mongoose } = require("mongoose");
const userModel = require("../models/user.model.js");
const musicModel = require("../models/music.model.js");
const albumModel = require("../models/album.model.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { cleanObject } = require("../utils/cleanData.js");
const { sendOtp, finalizeOtpVerification } = require("../utils/otp.js");
const { sendSuccess } = require("../utils/sendSuccess.js");
const { sendError } = require("../utils/sendError.js");
const { sendBackupEmail } = require("../services/email.service.js");

//🔹 Register User Fn
async function register(req, res) {
  try {
    const { username, fullName, email, password, role = "user" } = req.body;

    if (!username || !fullName || !email || !password) {
      return sendError(res, "auth/missing-fields");
    }

    if (password.length < 6) return sendError(res, "auth/weak-password");

    const isUserAlreadyExists = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (isUserAlreadyExists) {
      if (isUserAlreadyExists.email === email) {
        return sendError(res, "auth/email-already-exists");
      }
      return sendError(res, "auth/username-already-exists");
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

    const otpSent = await sendOtp(
      cleanObject(user, ["password"]),
      "register",
      res,
    );
    if (!otpSent) return;

    return sendSuccess(res, 201, "Registration successful. OTP sent to email.");
  } catch (error) {
    console.log(error);
    return sendError(res, "auth/server-error");
  }
}

//🔹 Log-in User Fn
async function login(req, res) {
  try {
    const { username, email, password } = req.body;

    const user = await userModel
      .findOne({ $or: [{ username }, { email }] })
      .select("+password");

    if (!user) {
      return sendError(res, "auth/invalid-credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return sendError(res, "auth/invalid-credentials");
    }

    const otpSent = await sendOtp(cleanObject(user), "login", res);
    if (!otpSent) return;

    return sendSuccess(
      res,
      200,
      "OTP sent successfully. Please verify to complete login.",
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "auth/server-error");
  }
}

//🔹 Log-out User Fn
async function logout(req, res) {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      await userModel.findByIdAndUpdate(decoded.id, { refreshToken: null });
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return sendSuccess(res, 200, "User logged out successfully");
  } catch (error) {
    console.log(error);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return sendError(res, "auth/server-error");
  }
}

//🔹 Refresh Token Fn
async function refreshToken(req, res) {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return sendError(res, "auth/refresh-token-missing");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (verifyError) {
      return sendError(res, "auth/session-expired");
    }

    const user = await userModel.findById(decoded.id).select("role");

    if (!user) {
      return sendError(res, "auth/user-not-found");
    }

    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN },
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN, 10) * 60 * 1000,
    });

    return sendSuccess(res, 200, "Token refreshed successfully");
  } catch (error) {
    console.log(error);
    return sendError(res, "auth/server-error");
  }
}

//🔹 Get current user
async function getMe(req, res) {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return sendError(res, "auth/user-not-found");
    }

    return sendSuccess(res, 200, "User fetched successfully", {
      user: cleanObject(user),
    });
  } catch (error) {
    console.log(error);
    return sendError(res, "auth/server-error");
  }
}

//🔹 Edit user profile
async function editProfile(req, res) {
  try {
    const { username, fullName, avatar } = req.body;
    if (!username && !fullName && !avatar) {
      return sendError(res, "auth/missing-fields");
    }

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return sendError(res, "auth/user-not-found");
    }

    if (username) user.username = username;
    if (fullName) user.fullName = fullName;
    if (avatar) user.avatar = avatar;

    await user.save();
    return sendSuccess(res, 200, "Profile updated successfully", {
      user: cleanObject(user),
    });
  } catch (error) {
    console.log(error);
    return sendError(res, "auth/server-error");
  }
}

//🔹 Change Role
async function changeRole(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await userModel.findById(req.user.id).session(session);
    if (!user) {
      await session.abortTransaction();
      return sendError(res, "auth/user-not-found");
    }

    // User → Artist
    if (user.role === "user") {
      user.role = "artist";
      await user.save({ session });
      await session.commitTransaction();

      const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN },
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN, 10) * 60 * 1000,
      });

      return sendSuccess(
        res,
        200,
        "Role changed to artist successfully",
        cleanObject(user, ["password"]),
      );
    }

    if (user.role !== "artist") {
      await session.abortTransaction();
      return sendError(res, "auth/invalid-role-change");
    }

    // Artist → User (backup + delete)
    const musicData = await musicModel
      .find({ artist: user._id })
      .session(session);

    const backup = {
      exportedAt: new Date().toISOString(),
      artistInfo: {
        username: user.username,
        fullName: user.fullName,
        email: user.email,
      },
      totalTracks: musicData.length,
      tracks: musicData.map((track) => ({
        title: track.title,
        audioUrl: track.audioUrl,
        coverImage: track.coverImage,
        duration: track.duration,
        createdAt: track.createdAt,
      })),
    };

    await sendBackupEmail(user.email, backup);
    await musicModel.deleteMany({ artist: user._id }).session(session);

    user.role = "user";
    await user.save({ session });

    await session.commitTransaction();

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN },
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN, 10) * 60 * 1000,
    });

    return sendSuccess(
      res,
      200,
      "Your account is now a regular user account. A backup of your music data has been sent to your email.",
      cleanObject(user, ["password"]) ,
    );
  } catch (error) {
    await session.abortTransaction();
    console.log(error);
    return sendError(res, "auth/server-error");
  } finally {
    session.endSession();
  }
}

//🔹 Change Email
async function changeEmail(req, res) {
  try {
    const { newEmail } = req.body;
    if (!newEmail) {
      return sendError(res, "auth/missing-fields");
    }

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return sendError(res, "auth/user-not-found");
    }

    const isEmailTaken = await userModel.findOne({ email: newEmail });
    if (isEmailTaken) {
      return sendError(res, "auth/email-already-exists");
    }

    const otpSent = await sendOtp(
      { email: user.email, newEmail },
      "update-email",
      res,
    );
    if (!otpSent) return;

    return sendSuccess(
      res,
      200,
      "Email change OTP sent successfully. Please verify to complete the change.",
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "auth/server-error");
  }
}

//🔹 Change password
async function changePassword(req, res) {
  try {
    const { oldPass, newPass } = req.body;

    if (!oldPass || !newPass) {
      return sendError(res, "auth/missing-fields");
    }

    const user = await userModel.findById(req.user.id).select("+password");
    if (!user) {
      return sendError(res, "auth/user-not-found");
    }

    const isOldPassValid = await bcrypt.compare(oldPass, user.password);
    if (!isOldPassValid) {
      return sendError(res, "auth/incorrect-old-password");
    }

    const isSameAsOld = await bcrypt.compare(newPass, user.password);
    if (isSameAsOld) {
      return sendError(res, "auth/password-same");
    }

    const newHash = await bcrypt.hash(newPass, 10);

    const otpSent = await sendOtp(
      { email: user.email, newPassword: newHash },
      "update-password",
      res,
    );

    if (!otpSent) return;

    return sendSuccess(
      res,
      200,
      "Password change OTP sent successfully. Please verify to complete the change.",
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "auth/server-error");
  }
}

//🔹 Forgot password
async function forgotPassword(req, res) {
  try {
    res.clearCookie("resetToken");
    const { email } = req.body;

    if (!email) {
      return sendError(res, "auth/missing-fields");
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return sendError(res, "auth/user-not-found");
    }

    const otpSent = await sendOtp({ email }, "reset-password", res);
    if (!otpSent) return;

    return sendSuccess(
      res,
      200,
      "Password reset OTP sent successfully. Please verify to complete the reset.",
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "auth/server-error");
  }
}

// 🔹 Reset password Fn
async function resetPassword(req, res) {
  try {
    const { newPassword } = req.body;
    const token = req.cookies.resetToken;

    if (!newPassword || !token) {
      return sendError(res, "auth/missing-fields");
    }

    if (newPassword.length < 6) {
      return sendError(res, "auth/weak-password");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.RESET_TOKEN_SECRET);
    } catch (error) {
      return sendError(res, "auth/session-expired");
    }

    const hash = await bcrypt.hash(newPassword, 10);

    const user = await userModel.findById(decoded.id).select("+password");
    if (!user) {
      return sendError(res, "auth/user-not-found");
    }

    user.password = hash;
    await user.save();

    res.clearCookie("resetToken");
    return sendSuccess(res, 200, "Password reset successfully");
  } catch (error) {
    console.log(error);
    return sendError(res, "auth/server-error");
  }
}

// 🔹 Verify OTP Fn
async function verifyOtp(req, res) {
  try {
    const userSentOtp = req.body.otp;
    const otpToken = req.cookies.otpToken;

    if (!userSentOtp || !otpToken) {
      return sendError(res, "auth/missing-fields");
    }

    let decoded;
    try {
      decoded = jwt.verify(otpToken, process.env.OTP_TOKEN_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return sendError(res, "auth/otp-expired");
      }
      return sendError(res, "auth/invalid-otp");
    }

    if (decoded.otp !== userSentOtp) {
      return sendError(res, "auth/invalid-otp");
    }

    const finalizedData = await finalizeOtpVerification(
      decoded.data,
      decoded.purpose,
      res,
    );
    if (!finalizedData) {
      return;
    }

    res.clearCookie("otpToken");
    return sendSuccess(
      res,
      200,
      "OTP verified successfully",
      cleanObject(finalizedData === true ? null : finalizedData, ["password"]),
    );
  } catch (error) {
    console.log(error);
    return sendError(res, "auth/server-error");
  }
}

// 🔹 Resend Otp FN
async function resendOtp(req, res) {
  try {
    const otpToken = req.cookies.otpToken;

    if (!otpToken) {
      return sendError(res, "auth/otp-token-required");
    }

    let decoded;
    try {
      decoded = jwt.verify(otpToken, process.env.OTP_TOKEN_SECRET, {
        ignoreExpiration: true,
      });
    } catch (error) {
      return sendError(res, "auth/invalid-otp");
    }

    const otpSent = await sendOtp(
      cleanObject(decoded.data, ["password"]),
      decoded.purpose,
      res,
    );
    if (!otpSent) return;

    return sendSuccess(res, 200, "OTP sent successfully");
  } catch (error) {
    console.log(error);
    return sendError(res, "auth/server-error");
  }
}

// 🔹 Delete Account Fn
async function deleteAccount(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await userModel.findByIdAndDelete(req.user.id).session(session);
    await musicModel.deleteMany({ artist: req.user.id }).session(session);
    await albumModel.deleteMany({ artist: req.user.id }).session(session);

    await session.commitTransaction();
    return sendSuccess(res, 200, "Account deleted successfully");
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    return sendError(res, "auth/server-error");
  } finally {
    session.endSession();
  }
}

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  editProfile,
  changeRole,
  changeEmail,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyOtp,
  resendOtp,
  deleteAccount,
};
