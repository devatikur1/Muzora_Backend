const express = require("express");
const otpController = require("../controllers/otp.controller");

const router = express.Router();

//🔹 Post Method
router.post("/send", otpController.sendOtp);
router.post("/verify", otpController.verifyOtp);



module.exports = router;