const musicModel = require("../models/music.model");
const { uploadFile } = require("../services/storage.service");

//🔹 Upload Music Fn
async function uploadMusic(req, res) {
  const { title } = req.body;
  const musicFile = req.files.uri[0];
  const avatarFile = req.files.avatar[0];
  console.log(req.files);

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
    music: {
      id: music._id,
      uri: music.uri,
      title: music.title,
      avatar: music.avatar,
      artist: music.artist,
    },
  });
}

module.exports = { uploadMusic };
