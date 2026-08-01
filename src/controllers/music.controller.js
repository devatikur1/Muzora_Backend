const musicModel = require("../models/music.model.js");
const { uploadFile } = require("../services/storage.service.js");
const { cleanObject } = require("../utils/cleanData.js");

//🔹 Upload music Fn
async function uploadMusic(req, res) {
  const { title } = req.body;
  const musicFile = req.files.uri[0];
  const avatarFile = req.files.avatar[0];

  const audio = await uploadFile(
    musicFile.buffer.toString("base64"),
    "music",
    "music",
  );
  const avatar = await uploadFile(
    avatarFile.buffer.toString("base64"),
    "avatar",
    "avatar",
  );

  const music = await musicModel.create({
    uri: audio.url,
    avatar: avatar.url,
    title,
    artist: req.user.id,
  });

  res.status(201).json({
    message: "Music upload successfully",
    music: cleanObject(music),
  });
}

//🔹 Get all musics Fn
async function getAllMusics(req, res) {
  const musics = await musicModel
    .find()
    .populate("artist", "username fullName email");

  const cleanedMusics = musics.map((music) => {
    const musicObj = music.toObject();
    return { ...cleanObject(musicObj), artist: cleanObject(musicObj.artist) };
  });

  res.status(200).json({
    message: "Musics fetched successfully",
    musics: cleanedMusics,
  });
}

module.exports = { uploadMusic, getAllMusics };
