const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "yt",    // rename command
  version: "1.0.0",
  role: 0,
  hasPrefix: false,
  aliases: ["yt", "ytsearch"],
  description: "Search and send a YouTube video via API",
  usage: "youtube [search query]",
  credits: "Xren",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!args[0]) {
    return api.sendMessage(
      "❌ Please provide a search keyword.\n\nUsage: youtube [search query]",
      threadID,
      messageID
    );
  }

  const query = encodeURIComponent(args.join(" "));
  const searchURL = `https://kaiz-apis.gleeze.com/api/ytsearch?q=${query}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

  await api.sendMessage("🔍 Searching YouTube, please wait...", threadID, messageID);

  try {
    const searchRes = await axios.get(searchURL);
    const results = searchRes.data;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return api.sendMessage("❌ No video found.", threadID, messageID);
    }

    const video = results[0];
    // Expect video object to have something like: title, videoUrl, thumbnail, channelName, etc.
    const { title, videoUrl, thumbnail, channelName } = video;

    if (!videoUrl) {
      return api.sendMessage("❌ Video URL not found in API response.", threadID, messageID);
    }

    // Prepare cache folder
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir);
    }

    const imgPath = path.join(cacheDir, `thumb_${senderID}.jpg`);

    // Download the thumbnail
    try {
      const imgRes = await axios.get(thumbnail, { responseType: "arraybuffer" });
      fs.writeFileSync(imgPath, imgRes.data);
    } catch (errThumb) {
      console.warn("Could not download thumbnail:", errThumb);
      // we can continue without image
    }

    // Send message with video info + thumbnail
    const msg = {
      body: `🎬 Title: ${title}\n📺 Channel: ${channelName || "Unknown"}\n🔗 Link: ${videoUrl}`,
      attachment: fs.existsSync(imgPath) ? fs.createReadStream(imgPath) : null,
    };

    api.sendMessage(msg, threadID, (err) => {
      if (err) console.error("Error sending thumbnail message:", err);
      // cleanup image file
      if (fs.existsSync(imgPath)) {
        try {
          fs.unlinkSync(imgPath);
        } catch (e) {
          console.warn("Failed to remove thumbnail cache:", e);
        }
      }
    });

  } catch (error) {
    console.error("YouTube command error:", error);
    return api.sendMessage(
      "❌ An error occurred while searching YouTube. Please try again later.",
      threadID,
      messageID
    );
  }
};