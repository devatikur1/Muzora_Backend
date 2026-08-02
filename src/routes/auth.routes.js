const express = require("express");
const authController = require('../controllers/auth.controller.js');
const { protect } = require("../middlewares/auth.middleware.js");

const router = express.Router();


// Register - new user account
router.post("/register", authController.register);

// Login - login existing user
router.post("/login", authController.login);

// Logout - cookie clear
router.post("/logout", authController.logout);

// Refresh token
router.post("/refresh-token", authController.refreshToken);

// Current logged-in user info
router.get("/me", protect, authController.getMe);

// Edit user profile (logged-in)
router.patch("/edit-profile", protect, authController.editProfile);

// Change Role (logged-in)
router.patch("/change-role", protect, authController.changeRole);

// Change Email (logged-in)
router.patch("/change-email", protect, authController.changeEmail);

// Password change (logged-in)
router.patch("/change-password", protect, authController.changePassword);

// Forgot password - request OTP
router.post("/forgot-password", authController.forgotPassword);

// Reset password - after OTP verification
router.post("/reset-password", authController.resetPassword);

// Verify OTP - after registration
router.post("/verify-otp", authController.verifyOtp);

// Resend OTP - if user didn't receive the OTP
router.post("/resend-otp", authController.resendOtp);

// Delete account - logged-in user
router.delete("/delete-account", protect, authController.deleteAccount);




module.exports = router;