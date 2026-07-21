const { ImageKit } = require("@imagekit/nodejs");

const client = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  // privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  // urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

async function uploadFile(file) {
  const result = await client.files.upload({
    file,
    fileName: "music_" + Date.now(),
    folder: "SPC/music",
  });

  return result;
}

module.exports = { uploadFile };
