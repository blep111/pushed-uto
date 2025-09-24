const axios = require('axios');
const path = require('path');
const fs = require('fs');

module.exports.config = {
  name: "tiktok",
  version: "1.0.0",
  role: 0,
  description: "Fetch a random TikTok shoti video.",
  hasPrefix: false,
  credits: "Vern",
  cooldowns: 10,
  category: "media"
};

module.exports.run = async function ({ api, event }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  try {
    api.sendMessage("📥 Fetching TikTok video, please wait...", threadID, () => {}, messageID);

    // Call API
    const res = await axios.get('https://xvi-rest-api.vercel.app/api/tiktok?query=dancing');
    const videoUrl = res.data?.details?.videoUrl || res.data?.videoUrl || res.data?.url;

    if (!videoUrl) {
      return api.sendMessage("❌ No video found. Please try again later.", threadID, () => {}, messageID);
    }

    const fileName = `${messageID}_tiktok.mp4`;
    const filePath = path.join(__dirname, fileName);

    // Download video
    const videoStream = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    videoStream.data.pipe(writer);

    writer.on('close', () => {
      api.sendMessage({
        body: '🎥 Here is your TikTok video!',
        attachment: fs.createReadStream(filePath)
      }, threadID, () => fs.unlinkSync(filePath), messageID);
    });

    writer.on('error', (err) => {
      console.error("Download error:", err);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      api.sendMessage("🚫 Error downloading the video. Please try again.", threadID, () => {}, messageID);
    });

  } catch (error) {
    console.error("❌ Error fetching TikTok video:", error);
    api.sendMessage("🚫 Error fetching TikTok video. Try again later.", threadID, () => {}, messageID);
  }
};