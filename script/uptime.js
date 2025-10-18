const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "uptime",
  version: "1.0.0",
  role: 0,
  hasPrefix: false,
  aliases: ["uptimebot", "botuptime"],
  description: "Check bot uptime using Kaiz API",
  usage: "uptime <Instagram> <GitHub> <Facebook> <hours> <minutes> <seconds> <botname>",
  credits: "Xren",
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (args.length < 7) {
    return api.sendMessage(
      "⚠️ Usage:\nuptime <Instagram> <GitHub> <Facebook> <hours> <minutes> <seconds> <botname>\nExample:\nuptime Xren https://github.com/blep111 https://www.facebook.com/profile.php?id=61582034805699 12 20 10 Xren",
      threadID,
      messageID
    );
  }

  const [instag, ghub, fb, hours, minutes, seconds, botname] = args;

  const apiURL = `https://kaiz-apis.gleeze.com/api/uptime?instag=${encodeURIComponent(instag)}&ghub=${encodeURIComponent(ghub)}&fb=${encodeURIComponent(fb)}&hours=${hours}&minutes=${minutes}&seconds=${seconds}&botname=${encodeURIComponent(botname)}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

  await api.sendMessage("⏳ Fetching uptime data...", threadID, messageID);

  try {
    const res = await axios.get(apiURL, { timeout: 15000 });
    const data = res.data;

    if (!data) {
      return api.sendMessage("❌ Failed to fetch uptime info.", threadID, messageID);
    }

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
        console.warn("Failed to download image:", imgErr.message);
      }
    }

    // Build message
    let message = `📡 Bot Uptime Info\n\n`;
    if (data.botname) message += `🤖 Bot Name: ${data.botname}\n`;
    if (data.hours !== undefined && data.minutes !== undefined && data.seconds !== undefined)
      message += `⏱ Uptime: ${data.hours}h ${data.minutes}m ${data.seconds}s\n`;
    if (data.instag) message += `📸 Instagram: ${data.instag}\n`;
    if (data.ghub) message += `💻 GitHub: ${data.ghub}\n`;
    if (data.fb) message += `📘 Facebook: ${data.fb}\n`;

    await api.sendMessage(
      { body: message, attachment: attachment },
      threadID,
      () => {
        // Cleanup image
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