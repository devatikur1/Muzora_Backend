const express = require("express");
const musicController = require("../controllers/music.controller.js");
const { protect, authCheckIsArtist} = require("../middlewares/auth.middleware.js");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

//🔹 Post Method
router.post("/upload", protect, authCheckIsArtist, upload.fields([{ name: "uri", maxCount: 1 },{ name: "avatar", maxCount: 1 }]), musicController.uploadMusic);

//🔹 Get Method
router.get("/", musicController.getAllMusics);

module.exports = router;
