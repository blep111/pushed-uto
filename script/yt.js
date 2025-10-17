const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytdl = require("@distube/ytdl-core"); // fixed YouTube downloader

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
    return api.sendMessage(
      "❌ Please provide a search keyword.\n\nUsage: youtube [video name]",
      threadID,
      messageID
    );
  }

  const keyword = encodeURIComponent(args.join(" "));
  const apiURL = `https://kaiz-apis.gleeze.com/api/yt-metadata?title=${keyword}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

  await api.sendMessage("📹 Searching video, please wait...", threadID, messageID);

  try {
    const res = await axios.get(apiURL);
    const data = res.data;

    if (!data || !data.url) {
      return api.sendMessage("❌ No YouTube video found.", threadID, messageID);
    }

    const { title, author, thumbnail, duration, views, uploaded, url } = data;

    const imgPath = path.join(__dirname, "cache", `thumb_${senderID}.jpg`);
    const videoPath = path.join(__dirname, "cache", `video_${senderID}.mp4`);

    // Download thumbnail
    const imgRes = await axios.get(thumbnail, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, imgRes.data);

    // Download YouTube video
    const videoStream = ytdl(url, {
      filter: (f) => f.container === "mp4" && f.hasAudio && f.hasVideo,
      quality: "lowest",
    });

    const writer = fs.createWriteStream(videoPath);
    videoStream.pipe(writer);

    writer.on("finish", () => {
      // Send thumbnail and info first
      api.sendMessage(
        {
          body: `🎬 Title: ${title}\n👤 Channel: ${author}\n⏱ Duration: ${duration}\n👁 Views: ${views}\n📅 Uploaded: ${uploaded}`,
          attachment: fs.createReadStream(imgPath),
        },
        threadID,
        () => {
          // Send the video file
          api.sendMessage(
            {
              body: "🎥 Here's your YouTube video!",
              attachment: fs.createReadStream(videoPath),
            },
            threadID,
            () => {
              fs.unlinkSync(imgPath);
              fs.unlinkSync(videoPath);
            }
          );
        }
      );
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