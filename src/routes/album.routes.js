const express = require("express");
const albumController = require("../controllers/album.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

//🔹 Post Method
router.post(
  "/create",
  authMiddleware.authCheckIsArtist,
  upload.single("avatar"),
  albumController.createAlbum,
);

//🔹 Get Method
router.get("/get", albumController.getAllAlbums);
router.get("/:albumId", albumController.getAlbumsById);

module.exports = router;
