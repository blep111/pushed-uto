const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "uptime",
  version: "1.5.0",
  role: 0,
  hasPrefix: false,
  aliases: ["uptimebot"],
  description: "Fetch bot uptime as an image with time and IG name",
  usage: "uptime",
  credits: "Xren",
  cooldown: 3,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  await api.sendMessage("⏳ Fetching uptime image...", threadID, messageID);

  try {
    // Preset API parameters
    const instag = "Xren";
    const ghub = "https://github.com/blep111";
    const fb = "https://www.facebook.com/profile.php?id=61582034805699";
    const botname = "Xren";

    // API URL: use 0 for time to let API calculate uptime
    const hours = 0;
    const minutes = 0;
    const seconds = 0;

    const apiURL = `https://kaiz-apis.gleeze.com/api/uptime?instag=${encodeURIComponent(instag)}&ghub=${encodeURIComponent(ghub)}&fb=${encodeURIComponent(fb)}&hours=${hours}&minutes=${minutes}&seconds=${seconds}&botname=${encodeURIComponent(botname)}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

    const res = await axios.get(apiURL, { responseType: "arraybuffer", timeout: 15000 });

    // Prepare cache folder
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    // Save the image
    const filePath = path.join(cacheDir, `uptime_${senderID}.png`);
    fs.writeFileSync(filePath, res.data);

    // Send success message with image attached
    await api.sendMessage(
      { body: "✅ Bot uptime fetched successfully!", attachment: fs.createReadStream(filePath) },
      threadID,
      () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      },
      messageID
    );

  } catch (err) {
    console.error("Error fetching uptime API image:", err.message);
    let errorMsg = "❌ Failed to fetch uptime image from API.";
    if (err.response) errorMsg += `\nStatus: ${err.response.status} ${err.response.statusText}`;
    await api.sendMessage(errorMsg, threadID, messageID);
  }
};