const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "babe",
  version: "1.0.0",
  role: 0,
  aliases: ["video", "randomvid"],
  description: "Send a random aesthetic video clip",
  usage: "vids",
  credits: "Xren",
  cooldown: 3,
};

module.exports.run = async function({ api, event }) {
  const videoLinks = [
    "https://i.imgur.com/ZNsVF5l.mp4",
    "https://i.imgur.com/2Fpm2RE.mp4",
    "https://i.imgur.com/rr7VyTR.mp4",
    "https://i.imgur.com/593AyS7.mp4",
    "https://i.imgur.com/4tMtsv6.mp4",
    "https://i.imgur.com/qNyCUYK.mp4",
    "https://i.imgur.com/ughjnNU.mp4",
    "https://i.imgur.com/3Ekztoz.mp4"
  ];

  const chosen = videoLinks[Math.floor(Math.random() * videoLinks.length)];
  const msg = await api.sendMessage("🎬 Fetching random video...", event.threadID);

  try {
    const response = await axios.get(chosen, { responseType: "arraybuffer" });

    const videoPath = path.join(__dirname, `/cache/aesthetic_${event.senderID}.mp4`);
    fs.writeFileSync(videoPath, response.data);

    await api.sendMessage({
      body: `✨ Here's your random video clip!\n🎥 Source: Imgur\n🎨 Credits: Xren`,
      attachment: fs.createReadStream(videoPath)
    }, event.threadID, () => fs.unlinkSync(videoPath), msg.messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage("❌ Failed to fetch the video. Please try again later.", event.threadID, msg.messageID);
  }
};