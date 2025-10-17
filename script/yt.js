const ytdl = require("ytdl-core");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "yt",
  version: "1.0.8",
  role: 0,
  hasPrefix: false,
  aliases: ["ytv", "ytvideo"],
  description: "Search YouTube and download only the first video result (fixed)",
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
  const apiURL = `https://kaiz-apis.gleeze.com/api/ytsearch?q=${query}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

  await api.sendMessage("🔍 Searching YouTube video...", threadID, messageID);

  try {
    // Get search results
    const { data } = await axios.get(apiURL);
    const items = Array.isArray(data.items) ? data.items : [];

    if (items.length === 0) {
      return api.sendMessage("❌ No results found for your query.", threadID, messageID);
    }

    // ✅ Get the first result only
    const first = items[0];
    let title = first.title || "Untitled Video";
    let videoUrl = first.url;
    const thumbnail = first.thumbnail;

    // 🔧 Fix incomplete YouTube links
    if (videoUrl && !videoUrl.startsWith("http")) {
      videoUrl = `https://www.youtube.com${videoUrl}`;
    }

    // ✅ Validate the URL
    if (!ytdl.validateURL(videoUrl)) {
      return api.sendMessage("❌ Invalid YouTube video URL.", threadID, messageID);
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

    // ✅ Download only one video stream
    const videoStream = ytdl(videoUrl, {
      quality: "highest",
      filter: "audioandvideo",
      highWaterMark: 1 << 25, // Prevent stream errors
    });

    const writeStream = fs.createWriteStream(videoPath);
    videoStream.pipe(writeStream);

    writeStream.on("finish", async () => {
      // Send thumbnail and title
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
      console.error("❌ Video download error:", err.message);
      api.sendMessage("❌ Failed to download the video (may be region-locked or private).", threadID, messageID);
    });

  } catch (err) {
    console.error("❌ YouTube API error:", err.message);
    api.sendMessage("❌ An error occurred while fetching the video.", threadID, messageID);
  }
};