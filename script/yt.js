const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "yt",
  version: "2.0.0",
  role: 0,
  hasPrefix: false,
  aliases: ["ytv", "ytvid", "ytsearch"],
  description: "Fetch the first YouTube result and auto-download the video using Kaiz API",
  usage: "ytvideo <search query>",
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
  const searchAPI = `https://api.ccprojectsapis-jonell.gleeze.com/api/ytsearch?title=${query}`;
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const videoPath = path.join(cacheDir, `yt_${senderID}_${Date.now()}.mp4`);

  try {
    await api.sendMessage("🎬 Searching YouTube for your video...", threadID, messageID);

    // 🔍 Step 1: Search for the first video result
    const searchRes = await axios.get(searchAPI);
    const videoData = searchRes.data;

    if (!videoData || !videoData.url) {
      return api.sendMessage("❌ No video found for your search.", threadID, messageID);
    }

    const videoUrl = encodeURIComponent(videoData.url);
    const videoTitle = videoData.title || "Untitled Video";

    // 🎥 Step 2: Download video using Kaiz API
    const downAPI = `https://kaiz-apis.gleeze.com/api/yt-down?url=${videoUrl}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

    await api.sendMessage(`📥 Downloading: ${videoTitle}`, threadID, messageID);

    const downRes = await axios.get(downAPI);

    if (!downRes.data || !downRes.data.url) {
      return api.sendMessage("❌ Failed to get video download link.", threadID, messageID);
    }

    const downloadLink = downRes.data.url;

    // 🧩 Step 3: Download the actual video file
    const videoFile = await axios.get(downloadLink, { responseType: "arraybuffer" });
    fs.writeFileSync(videoPath, videoFile.data);

    await api.sendMessage(
      {
        body: `🎬 ${videoTitle}\n📺 Source: YouTube\n👑 Credits: Xren`,
        attachment: fs.createReadStream(videoPath),
      },
      threadID,
      () => {
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      }
    );
  } catch (err) {
    console.error("YT command error:", err.message);
    api.sendMessage(
      "❌ Failed to fetch or process the video. Please try again later.",
      threadID,
      messageID
    );
  }
};