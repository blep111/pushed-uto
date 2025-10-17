const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytdl = require("ytdl-core");

module.exports.config = {
  name: "sc",
  version: "1.0.0",
  role: 0,
  hasPrefix: false,
  aliases: ["ytmetadata", "ytinfo"],
  description: "Fetch YouTube video metadata and send the actual video",
  usage: "ytmeta [video title or keywords]",
  credits: "DeansG Mangubat x Kaizenji",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!args[0]) {
    return api.sendMessage(
      "❌ Please enter a YouTube video title or keywords.\n\nExample:\n`ytmeta multo cup of joe`",
      threadID,
      messageID
    );
  }

  const query = encodeURIComponent(args.join(" "));
  const apiUrl = `https://kaiz-apis.gleeze.com/api/yt-metadata?title=${query}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

  try {
    await api.sendMessage("🎬 Searching YouTube and preparing your video...", threadID, messageID);

    const { data } = await axios.get(apiUrl);

    if (!data || !data.url) {
      return api.sendMessage("❌ No video found for your search.", threadID, messageID);
    }

    const { title, thumbnail, duration, author, views, uploaded, url } = data;

    // Prepare cache folder
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const videoPath = path.join(cacheDir, `ytmeta_${senderID}.mp4`);
    const thumbPath = path.join(cacheDir, `ytthumb_${senderID}.jpg`);

    // Download thumbnail
    try {
      const thumbRes = await axios.get(thumbnail, { responseType: "arraybuffer" });
      fs.writeFileSync(thumbPath, thumbRes.data);
    } catch {
      console.warn("⚠️ Failed to download thumbnail.");
    }

    // Download YouTube video (highest quality within Messenger limits)
    const videoStream = ytdl(url, {
      quality: "lowest", // use "highest" if your host can handle large files
      filter: "audioandvideo",
    });
    const writeStream = fs.createWriteStream(videoPath);
    videoStream.pipe(writeStream);

    writeStream.on("finish", async () => {
      const caption = `🎵 ${title}\n👤 ${author}\n🕒 ${duration}\n👁️ ${views}\n📅 ${uploaded}\n\n📽️ Enjoy your video!`;

      await api.sendMessage(
        {
          body: caption,
          attachment: fs.existsSync(thumbPath) ? fs.createReadStream(thumbPath) : null,
        },
        threadID,
        async () => {
          // Send the actual video
          api.sendMessage(
            {
              body: "📹 Download complete — here’s your video:",
              attachment: fs.createReadStream(videoPath),
            },
            threadID,
            () => {
              // Cleanup temp files
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
    console.error("❌ ytmeta command error:", err);
    api.sendMessage("⚠️ Error fetching YouTube video. Please try again later.", threadID, messageID);
  }
};