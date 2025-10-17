const ytdl = require("ytdl-core");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "yt",
  version: "1.0.7",
  role: 0,
  hasPrefix: false,
  aliases: ["ytv", "ytvideo"],
  description: "Download only the first YouTube video result (no spam)",
  usage: "yt [search query]",
  credits: "You",
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

  await api.sendMessage("🎬 Searching YouTube for the first video...", threadID, messageID);

  try {
    // Get search results (just once)
    const { data } = await axios.get(searchURL);
    const items = Array.isArray(data.items) ? data.items : [];

    if (items.length === 0) {
      return api.sendMessage("❌ No results found for your query.", threadID, messageID);
    }

    // ✅ Take ONLY the first result
    const first = items[0];
    const title = first.title || "Untitled Video";
    const videoUrl = first.url;
    const thumbnail = first.thumbnail;

    if (!videoUrl || !ytdl.validateURL(videoUrl)) {
      return api.sendMessage("❌ Invalid or missing video URL.", threadID, messageID);
    }

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const videoPath = path.join(cacheDir, `yt_${senderID}.mp4`);
    const thumbPath = path.join(cacheDir, `thumb_${senderID}.jpg`);

    // Download only the FIRST thumbnail
    try {
      const thumbRes = await axios.get(thumbnail, { responseType: "arraybuffer" });
      fs.writeFileSync(thumbPath, thumbRes.data);
    } catch (errThumb) {
      console.warn("⚠️ Failed to download thumbnail:", errThumb.message);
    }

    // ✅ Download only ONE video (the first)
    const videoStream = ytdl(videoUrl, { quality: "highest", filter: "audioandvideo" });
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
          // Then send video
          await api.sendMessage(
            {
              body: "📹 Here's your YouTube video (first result):",
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
    console.error("❌ YouTube API error:", err.message);
    api.sendMessage("❌ An error occurred while fetching the video.", threadID, messageID);
  }
};