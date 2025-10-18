const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "uptime",
  version: "1.9.0",
  role: 0,
  hasPrefix: false,
  aliases: ["uptimebot"],
  description: "Live bot uptime with dynamic image updates every second",
  usage: "uptime",
  credits: "Xren",
  cooldown: 3,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, senderID } = event;

  const instag = "Xren";
  const ghub = "Xren dev";
  const fb = "Xren";
  const botname = "Xx";

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const startTime = Date.now();

  // Send initial placeholder message
  let sentMsg = await api.sendMessage("⏱ Fetching live uptime image...", threadID);

  const updateImage = async () => {
    const elapsed = Date.now() - startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    const apiURL = `https://kaiz-apis.gleeze.com/api/uptime?instag=${encodeURIComponent(instag)}&ghub=${encodeURIComponent(ghub)}&fb=${encodeURIComponent(fb)}&hours=${hours}&minutes=${minutes}&seconds=${seconds}&botname=${encodeURIComponent(botname)}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

    try {
      const res = await axios.get(apiURL, { responseType: "arraybuffer" });
      const filePath = path.join(cacheDir, `uptime_${senderID}.png`);
      fs.writeFileSync(filePath, res.data);

      // Edit previous message with updated image
      await api.changeMessage(
        { body: `⏱ Live Bot Uptime: ${hours}h ${minutes}m ${seconds}s`, attachment: fs.createReadStream(filePath) },
        threadID,
        sentMsg.messageID
      );

      // Cleanup
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Error fetching uptime image:", err.message);
    }
  };

  // Initial update
  updateImage();

  // Update every 1 second
  const interval = setInterval(updateImage, 1000);

  // Optional: stop after a very long time (e.g., 24 hours)
  // setTimeout(() => clearInterval(interval), 24 * 60 * 60 * 1000);
};