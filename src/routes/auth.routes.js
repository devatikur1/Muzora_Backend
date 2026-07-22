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



module.exports = router;