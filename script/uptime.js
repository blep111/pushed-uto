const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "uptime",
  version: "2.0.0",
  role: 0,
  hasPrefix: false,
  aliases: ["uptimebot"],
  description: "Live bot uptime with static image and dynamic seconds",
  usage: "uptime",
  credits: "Xren",
  cooldown: 3,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, senderID } = event;

  const instag = "ren";
  const ghub = "Xren dev";
  const fb = "Xren";
  const botname = "Xx";

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  // Fetch the static image from API once
  let imagePath = path.join(cacheDir, `uptime_${senderID}.png`);
  try {
    const apiURL = `https://kaiz-apis.gleeze.com/api/uptime?instag=${encodeURIComponent(instag)}&ghub=${encodeURIComponent(ghub)}&fb=${encodeURIComponent(fb)}&hours=0&minutes=0&seconds=0&botname=${encodeURIComponent(botname)}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

    const res = await axios.get(apiURL, { responseType: "arraybuffer" });
    fs.writeFileSync(imagePath, res.data);
  } catch (err) {
    console.error("❌ Failed to fetch uptime image:", err.message);
    return api.sendMessage("❌ Failed to fetch uptime image.", threadID);
  }

  // Send initial message with image + starting uptime
  const startTime = Date.now();
  let sentMsg = await api.sendMessage(
    { body: `⏱ Bot Uptime: 0h 0m 0s`, attachment: fs.createReadStream(imagePath) },
    threadID
  );

  // Update uptime every second locally
  const interval = setInterval(async () => {
    const elapsed = Date.now() - startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    try {
      await api.changeMessage(
        { body: `⏱ Bot Uptime: ${hours}h ${minutes}m ${seconds}s`, attachment: fs.createReadStream(imagePath) },
        threadID,
        sentMsg.messageID
      );
    } catch (err) {
      clearInterval(interval); // stop if message cannot be edited
    }
  }, 1000);
};