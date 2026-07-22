const albumModel = require("../models/album.model");
const { uploadFile } = require("../services/storage.service");
const { cleanObject, cleanArray } = require("../utils/cleanData");

//🔹 Create album Fn
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
    album: cleanObject(album),
  });
}

//🔹 Get all albums Fn
async function getAllAlbums(req, res) {
  const albums = await albumModel
    .find()
    .skip(1)
    .limit(20)
    .select("title avatar artist")
    .populate("artist", "username fullName email");

  const cleanedAlbums = albums.map((album) => {
    const albumObj = album.toObject();
    return {
      ...cleanObject(albumObj),
      artist: cleanObject(albumObj.artist),
    };
  });

  res.status(200).json({
    message: "Albums fetched successfully",
    albums: cleanedAlbums,
  });
}

//🔹 Get One albums bye Id Fn
async function getAlbumsById(req, res) {
  const albumId = req.params.albumId;

  const album = await albumModel
    .findById(albumId)
    .populate("artist", "username fullName email");

  res.status(200).json({
    message: "Album fetched successfully",
    albums: {
      ...cleanObject(album),
      artist: cleanObject(album.artist),
    },
  });
}



module.exports = { createAlbum, getAllAlbums, getAlbumsById };