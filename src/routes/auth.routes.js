const express = require("express");
const authController = require('../controllers/auth.controller');
const { protect } = require("../middlewares/auth.middleware");

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

// Password change (logged-in)
router.put("/change-password", protect, authController.changePassword);





module.exports = router;