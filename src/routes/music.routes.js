const express = require("express");
const musicController = require("../controllers/music.controller");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

//🔹 Post Method
router.post("/upload", upload.single("music"), musicController.createMusic);

module.exports = router;
