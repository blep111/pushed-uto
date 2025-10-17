const ytdl = require("ytdl-core");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "yt",
  version: "1.0.4",
  role: 0,
  hasPrefix: false,
  aliases: ["ytv", "ytvideo"],
  description: "Search YouTube and send the first video as MP4 with thumbnail",
  usage: "youtubevideo [search query]",
  credits: "You",
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

  await api.sendMessage("🎬 Searching YouTube and preparing video...", threadID, messageID);

  try {
    // Search YouTube
    const searchRes = await axios.get(searchURL);
    const results = searchRes.data.items;

    if (!results || results.length === 0) {
      return api.sendMessage("❌ No video found.", threadID, messageID);
    }

    const video = results[0]; // ✅ only first result
    const { title, url, thumbnail } = video;

    // Prepare cache folder
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const videoPath = path.join(cacheDir, `yt_${senderID}.mp4`);
    const thumbPath = path.join(cacheDir, `thumb_${senderID}.jpg`);

    // Download thumbnail
    try {
      const imgRes = await axios.get(thumbnail, { responseType: "arraybuffer" });
      fs.writeFileSync(thumbPath, imgRes.data);
    } catch (errThumb) {
      console.warn("Could not download thumbnail:", errThumb);
    }

    // Download YouTube video
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
        () => {
          // Then send video
          api.sendMessage(
            {
              body: "📹 Here’s your video!",
              attachment: fs.createReadStream(videoPath),
            },
            threadID,
            () => {
              // Cleanup temporary files
              if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
              if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
            }
          );
        }
      );
    });

    videoStream.on("error", (err) => {
      console.error("Video download error:", err);
      return api.sendMessage("❌ Failed to download video.", threadID, messageID);
    });

  } catch (err) {
    console.error("YouTube video command error:", err);
    return api.sendMessage(
      "❌ An error occurred while fetching the video. Please try again later.",
      threadID,
      messageID
    );
  }
};