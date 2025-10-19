const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytdl = require("ytdl-core");

module.exports.config = {
  name: "yt",
  version: "1.0.2",
  role: 0,
  hasPrefix: false,
  aliases: ["ytv", "ytsearch"],
  description: "Fetch and send the first YouTube video result by title",
  usage: "ytvideo <search title>",
  credits: "Xren",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!args[0]) {
    return api.sendMessage(
      "⚠️ Please provide a YouTube video title.\n\nExample:\nytvideo multo cup of Joe",
      threadID,
      messageID
    );
  }

  const query = encodeURIComponent(args.join(" "));
  const apiURL = `https://api.ccprojectsapis-jonell.gleeze.com/api/ytsearch?title=${query}`;

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const videoPath = path.join(cacheDir, `yt_${senderID}_${Date.now()}.mp4`);

  try {
    api.sendMessage("🎬 Searching YouTube and fetching the first video...", threadID, messageID);

    // 🔍 Fetch the first video data
    const res = await axios.get(apiURL);
    const data = res.data;

    if (!data || !data.url) {
      return api.sendMessage("❌ No video found for your search.", threadID, messageID);
    }

    const videoUrl = data.url; // ✅ first result only
    const videoTitle = data.title || "Untitled Video";

    // 🎥 Download the video
    const stream = ytdl(videoUrl, { quality: "highestvideo" });
    const writeStream = fs.createWriteStream(videoPath);
    stream.pipe(writeStream);

    stream.on("error", (err) => {
      console.error("Download error:", err);
      api.sendMessage("❌ Failed to download the video.", threadID, messageID);
    });

    writeStream.on("finish", async () => {
      await api.sendMessage(
        {
          body: `🎬 ${videoTitle}\n\n📺 Source: YouTube\n👑 Credits: Xren`,
          attachment: fs.createReadStream(videoPath),
        },
        threadID,
        () => {
          // Cleanup after sending
          if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        }
      );
    });
  } catch (err) {
    console.error("Error fetching video:", err);
    api.sendMessage("❌ Failed to fetch or process the video. Please try again later.", threadID, messageID);
  }
};