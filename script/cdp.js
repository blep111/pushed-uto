const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "cdp",
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  aliases: ["cdpimg", "cdpphoto"],
  description: "Get photos and info from the CDP API.",
  usage: "cdp",
  credits: "Nax",
  cooldown: 10,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  const apiUrl = "https://ace-rest-api.onrender.com/api/cdp";

  try {
    // Call the API
    const resp = await axios.get(apiUrl);
    const data = resp.data;
    if (
      !data ||
      !data.avatar ||
      !Array.isArray(data.avatar) ||
      data.avatar.length === 0
    ) {
      return api.sendMessage("❌ Could not get CDP photos.", threadID, messageID);
    }

    // Download all avatars (images)
    const imageFiles = [];
    for (let i = 0; i < data.avatar.length; i++) {
      const imgUrl = data.avatar[i];
      const ext = path.extname(imgUrl).split("?")[0] || ".jpg";
      const fileName = `${messageID}-cdp-${i}${ext}`;
      const filePath = path.join(__dirname, fileName);

      try {
        const imgResp = await axios.get(imgUrl, { responseType: "stream" });
        const writer = fs.createWriteStream(filePath);
        imgResp.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        imageFiles.push(filePath);
      } catch (err) {
        // On error, skip this image
        console.error(`Error downloading image ${imgUrl}:`, err);
      }
    }

    if (imageFiles.length === 0) {
      return api.sendMessage("❌ Failed to download images.", threadID, messageID);
    }

    let infoText = "";
    if (data.character) infoText += `👥 Character: ${data.character}\n`;
    if (data.anime) infoText += `📺 Anime: ${data.anime}\n`;

    await api.sendMessage(
      {
        body: infoText.trim() || "CDP Photos:",
        attachment: imageFiles.map(file => fs.createReadStream(file)),
      },
      threadID,
      () => {
        // Clean up image files
        imageFiles.forEach(file => fs.unlink(file, () => {}));
      },
      messageID
    );
  } catch (err) {
    console.error("CDP API error:", err);
    return api.sendMessage("❌ Failed to get CDP photos. Please try again later.", threadID, messageID);
  }
};