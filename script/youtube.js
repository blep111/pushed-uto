const ytdl = require("ytdl-core");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "yt",
  version: "1.0.6",
  role: 0,
  hasPrefix: false,
  aliases: ["ytv", "ytvideo"],
  description: "Search YouTube and download only the first video result",
  usage: "yt [search query]",
  credits: "Xren",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!args[0]) {
    return api.sendMessage(
      "❌ Please provide a search keyword.\n\nUsage: yt [search query]",
      threadID,
      messageID
    );
  }

  const query = encodeURIComponent(args.join(" "));
  const searchURL = `https://kaiz-apis.gleeze.com/api/ytsearch?q=${query}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

  await api.sendMessage("🎬 Searching YouTube for the first result...", threadID, messageID);

  try {
    // Fetch search results
    const searchRes = await axios.get(searchURL);
    const results = searchRes.data.items;

    // ✅ Only use the very first result
    if (!results || results.length === 0) {
      return api.sendMessage("❌ No results found for your query.", threadID, messageID);
    }

    const firstVideo = results[0];
    const title = firstVideo.title || "Untitled Video";
    const videoUrl = firstVideo.url;
    const thumbnail = firstVideo.thumbnail;

    if (!videoUrl) {
      return api.sendMessage("❌ No valid video URL found.", threadID, messageID);
    }

    // Prepare cache directory
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const videoPath = path.join(cacheDir, `yt_${senderID}.mp4`);
    const thumbPath = path.join(cacheDir, `thumb_${senderID}.jpg`);

    // Download thumbnail
    try {
      const thumbRes = await axios.get(thumbnail, { responseType: "arraybuffer" });
      fs.writeFileSync(thumbPath, thumbRes.data);
    } catch (errThumb) {
      console.warn("⚠️ Thumbnail download failed:", errThumb.message);
    }

    // Download video
    const videoStream = ytdl(videoUrl, { quality: "highestvideo" });
    const writeStream = fs.createWriteStream(videoPath);
    videoStream.pipe(writeStream);

    writeStream.on("finish", async () => {
      // Send thumbnail first with title
      await api.sendMessage(
        {
          body: `🎬 ${title}`,
          attachment: fs.existsSync(thumbPath) ? fs.createReadStream(thumbPath) : null,
        },
        threadID,
        async () => {
          // Then send the video
          await api.sendMessage(
            {
              body: "📹 Here's the first YouTube video result:",
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
      console.error("❌ Video download error:", err);
      api.sendMessage("❌ Failed to download the video.", threadID, messageID);
    });

  } catch (err) {
    console.error("❌ YouTube command error:", err);
    api.sendMessage("❌ An error occurred while fetching the video.", threadID, messageID);
  }
};