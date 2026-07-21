const express = require("express");
const albumController = require("../controllers/album.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

//🔹 Post Method
router.post(
  "/create",
  authMiddleware.authArtist,
  upload.single("avatar"),
  albumController.createAlbum,
);

module.exports = router;
