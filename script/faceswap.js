const axios = require('axios');
const fs = require('fs-extra');

module.exports.config = {
  name: "faceswap",
  version: "1.0.0",
  role: 0,
  credits: "Vern",
  aliases: [],
  usages: "< reply two images >",
  cooldown: 2,
};

module.exports.run = async ({ api, event }) => {
  let pathie = __dirname + `/cache/faceswapped-image.jpg`;
  const { threadID, messageID } = event;

  // Get the URLs of the two images from the reply
  const image1 = event.messageReply?.attachments[0]?.url;
  const image2 = event.messageReply?.attachments[1]?.url;

  if (!image1 || !image2) {
    return api.sendMessage("❌ Please reply to two images to use the face swap feature.", threadID, messageID);
  }

  try {
    api.sendMessage("⌛ Swapping faces, please wait...", threadID, messageID);

    // Call the face swap API
    const faceswapUrl = `https://kaiz-apis.gleeze.com/api/faceswap-v3?image1=${encodeURIComponent(image1)}&image2=${encodeURIComponent(image2)}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

    // Fetch the processed image
    const img = (await axios.get(faceswapUrl, { responseType: "arraybuffer" })).data;

    // Save the image to the file system
    fs.writeFileSync(pathie, Buffer.from(img, 'utf-8'));

    // Send the face-swapped image back to the user
    api.sendMessage({
      body: "🪄| Face swap completed successfully",
      attachment: fs.createReadStream(pathie)
    }, threadID, () => fs.unlinkSync(pathie), messageID);
  } catch (error) {
    api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};