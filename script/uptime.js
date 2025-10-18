const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "uptime",
  version: "1.4.0",
  role: 0,
  hasPrefix: false,
  aliases: ["uptimebot"],
  description: "Fetch bot uptime automatically with image and info",
  usage: "uptime",
  credits: "Xren",
  cooldown: 3,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  await api.sendMessage("⏳ Fetching uptime info...", threadID, messageID);

  try {
    // Preset parameters
    const instag = "Xren";
    const ghub = "https://github.com/blep111";
    const fb = "https://www.facebook.com/profile.php?id=61582034805699";
    const botname = "Xren";

    // Use 0 for hours/minutes/seconds so API will calculate current uptime
    const hours = 0;
    const minutes = 0;
    const seconds = 0;

    const apiURL = `https://kaiz-apis.gleeze.com/api/uptime?instag=${encodeURIComponent(instag)}&ghub=${encodeURIComponent(ghub)}&fb=${encodeURIComponent(fb)}&hours=${hours}&minutes=${minutes}&seconds=${seconds}&botname=${encodeURIComponent(botname)}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

    const res = await axios.get(apiURL, { timeout: 15000 });
    const data = res.data;

    if (!data) return api.sendMessage("❌ Failed to fetch uptime info.", threadID, messageID);

    // Prepare cache folder
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    // Download image if exists
    let attachment = null;
    if (data.image) {
      try {
        const imgRes = await axios.get(data.image, { responseType: "arraybuffer" });
        const filePath = path.join(cacheDir, `uptime_${senderID}.png`);
        fs.writeFileSync(filePath, imgRes.data);
        attachment = fs.createReadStream(filePath);
      } catch (imgErr) {
        console.warn("❌ Failed to download image:", imgErr.message);
      }
    }

    // Build message
    let message = `📡 Bot Uptime Info\n\n`;
    message += `🤖 Bot Name: ${data.botname || botname}\n`;
    message += `⏱ Uptime: ${data.hours || 0}h ${data.minutes || 0}m ${data.seconds || 0}s\n`;
    if (data.instag) message += `📸 Instagram: ${data.instag}\n`;
    if (data.ghub) message += `💻 GitHub: ${data.ghub}\n`;
    if (data.fb) message += `📘 Facebook: ${data.fb}\n`;

    await api.sendMessage(
      { body: message, attachment: attachment },
      threadID,
      () => {
        if (attachment && fs.existsSync(attachment.path)) fs.unlinkSync(attachment.path);
      },
      messageID
    );

  } catch (err) {
    console.error("Error fetching uptime API:", err.message);
    let errorMsg = "❌ Failed to fetch uptime API.";
    if (err.response) errorMsg += `\nStatus: ${err.response.status} ${err.response.statusText}`;
    await api.sendMessage(errorMsg, threadID, messageID);
  }
};