const express = require("express");
const authController = require('../controllers/auth.controller');
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

//🔹 Post Method
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/logout", authController.logOutUser);

//🔹 Get Method
router.get("/me", authMiddleware.authCheckLogin, authController.getCurrentUser);

// 🔹 Patch method
router.patch("/edit", authMiddleware.authCheckLogin, authController.getCurrentUser);
router.patch("/change-password", authMiddleware.authCheckLogin, authController.changePassword);

// 🔹 Delete method
router.delete("/delete", authMiddleware.authCheckLogin, authController.deleteAccount);





module.exports = router;