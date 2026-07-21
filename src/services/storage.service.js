const { ImageKit } = require("@imagekit/nodejs");

const client = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
});

async function uploadFile(file, fileName, folder) {
  const result = await client.files.upload({
    file,
    fileName: fileName + "_" + Date.now(),
    folder: `SPC/${folder}`,
  });

  return result;
}

module.exports = { uploadFile };
