const ytdl = require("ytdl-core");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "yt",
  version: "1.0.5",
  role: 0,
  hasPrefix: false,
  aliases: ["ytv", "ytvideo"],
  description: "Search YouTube and send only the first video as MP4 with thumbnail",
  usage: "youtubevideo [search query]",
  credits: "Xren",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!args[0]) {
    return api.sendMessage(
      "❌ Please provide a search keyword.\n\nUsage: youtubevideo [search query]",
      threadID,
      messageID
    );
  }

  const query = encodeURIComponent(args.join(" "));
  const searchURL = `https://kaiz-apis.gleeze.com/api/ytsearch?q=${query}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

  await api.sendMessage("🎬 Searching YouTube for the first video...", threadID, messageID);

  try {
    // Fetch search results
    const searchRes = await axios.get(searchURL);
    const results = searchRes.data.items;

    // ✅ Only use the first result
    if (!results || results.length === 0) {
      return api.sendMessage("❌ No video found.", threadID, messageID);
    }

    const firstVideo = results[0];
    let { title, url, thumbnail } = firstVideo;

    // 🔧 Fix URL if incomplete
    if (!url.startsWith("http")) url = `https://www.youtube.com${url}`;

    if (!ytdl.validateURL(url)) {
      return api.sendMessage("❌ Invalid YouTube URL.", threadID, messageID);
    }

    // Prepare cache folder
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const videoPath = path.join(cacheDir, `yt_${senderID}.mp4`);
    const thumbPath = path.join(cacheDir, `thumb_${senderID}.jpg`);

    // Download thumbnail
    try {
      const imgRes = await axios.get(thumbnail, { responseType: "arraybuffer" });
      fs.writeFileSync(thumbPath, imgRes.data);
    } catch {
      console.warn("⚠️ Could not download thumbnail.");
    }

    // Download only the first video
    const videoStream = ytdl(url, { quality: "highestvideo" });
    const writeStream = fs.createWriteStream(videoPath);
    videoStream.pipe(writeStream);

    writeStream.on("finish", async () => {
      // Send thumbnail first
      await api.sendMessage(
        {
          body: `🎬 ${title}`,
          attachment: fs.existsSync(thumbPath) ? fs.createReadStream(thumbPath) : null,
        },
        threadID,
        async () => {
          // Send video
          await api.sendMessage(
            {
              body: "📹 Here's your video (first result only):",
              attachment: fs.createReadStream(videoPath),
            },
            threadID,
            () => {
              // Cleanup
              if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
              if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
            }
          );
        }
      );
    });

    videoStream.on("error", (err) => {
      console.error("❌ Video download error:", err.message);
      api.sendMessage(
        "❌ Failed to download video. It might be private, region-locked, or removed.",
        threadID,
        messageID
      );
    });

  } catch (err) {
    console.error("❌ YouTube command error:", err.message);
    api.sendMessage(
      "❌ An error occurred while fetching the video. Please try again later.",
      threadID,
      messageID
    );
  }
};