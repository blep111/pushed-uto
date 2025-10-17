const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytdl = require("@distube/ytdl-core"); // patched YouTube downloader

module.exports.config = {
  name: "sc",
  version: "1.0.0",
  role: 0,
  hasPrefix: false,
  aliases: [],
  description: "Search and download YouTube video by title.",
  usage: "youtube [video name]",
  credits: "Vern",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;

  if (!args[0]) {
    return api.sendMessage("❌ Please provide a video title.\n\nUsage: youtube [video name]", threadID, messageID);
  }

  const keyword = encodeURIComponent(args.join(" "));
  const searchURL = `https://kaiz-apis.gleeze.com/api/yt-metadata?title=${keyword}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

  await api.sendMessage("📹 Fetching YouTube video, please wait...", threadID, messageID);

  try {
    const searchRes = await axios.get(searchURL);
    const data = searchRes.data;

    if (!data || !data.url) {
      return api.sendMessage("❌ No YouTube video found.", threadID, messageID);
    }

    const { title, author, duration, thumbnail, url, views, uploaded } = data;

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const videoPath = path.join(cacheDir, `video_${senderID}.mp4`);
    const imgPath = path.join(cacheDir, `thumb_${senderID}.jpg`);

    // Download thumbnail
    const imgRes = await axios.get(thumbnail, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, imgRes.data);

    // Download YouTube video
    const videoStream = ytdl(url, {
      filter: (f) => f.container === "mp4" && f.hasAudio && f.hasVideo,
      quality: "lowest", // choose safe format for sending
    });

    const writer = fs.createWriteStream(videoPath);
    videoStream.pipe(writer);

    writer.on("finish", async () => {
      // Send thumbnail first with info
      api.sendMessage({
        body: `🎬 Title: ${title}\n👤 Channel: ${author}\n⏱ Duration: ${duration}\n👁 Views: ${views}\n📅 Uploaded: ${uploaded}`,
        attachment: fs.createReadStream(imgPath)
      }, threadID, () => {
        // Then send video
        api.sendMessage({
          body: "🎥 Here’s your YouTube video!",
          attachment: fs.createReadStream(videoPath)
        }, threadID, () => {
          fs.unlinkSync(videoPath);
          fs.unlinkSync(imgPath);
        });
      });
    });

    writer.on("error", (err) => {
      console.error("Download error:", err);
      api.sendMessage("❌ Failed to download the video.", threadID, messageID);
    });

  } catch (error) {
    console.error("YouTube command error:", error);
    return api.sendMessage("❌ An error occurred while processing your request.", threadID, messageID);
  }
};