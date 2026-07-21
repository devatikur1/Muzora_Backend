const albumModel = require("../models/album.model");
const { uploadFile } = require("../services/storage.service");

//🔹 Create Album Fn
async function createAlbum(req, res) {
  const { title, musicsIds } = req.body;
  const musicsIdsArr = Array.isArray(musicsIds) ? musicsIds : [musicsIds];
  const avatarFile = req.file;

  const avatar = await uploadFile(
    avatarFile.buffer.toString("base64"),
    "avater",
    "avater",
  );

  const album = await albumModel.create({
    title,
    avatar: avatar.url,
    musics: musicsIdsArr,
    artist: req.user.id,
  });

  res.status(201).json({
    message: "Album created successfully",
    album: {
      id: album._id,
      title: album.title,
      musics: album.musics,
      artist: album.album,
    },
  });
}

module.exports = { createAlbum };
