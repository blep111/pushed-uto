const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytdl = require("@distube/ytdl-core"); // <- newer, patched fork

module.exports.config = {
  name: "sc",
  version: "1.1.0",
  role: 0,
  aliases: ["ytvideo", "ytmetadata"],
  description: "Fetch a YouTube video by title and send it directly",
  usage: "ytmeta <title>",
  credits: "Xren",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  if (!args[0])
    return api.sendMessage(
      "❌ Please provide a video title.\nExample: ytmeta multo cup of joe",
      threadID,
      messageID
    );

  const query = encodeURIComponent(args.join(" "));
  const infoURL = `https://kaiz-apis.gleeze.com/api/yt-metadata?title=${query}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

  try {
    await api.sendMessage("🎬 Searching and fetching video…", threadID, messageID);
    const { data } = await axios.get(infoURL);

    if (!data?.url) return api.sendMessage("⚠️ No video found.", threadID, messageID);

    const { title, thumbnail, duration, views, author, uploaded, url } = data;
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    const videoPath = path.join(cacheDir, `yt_${senderID}.mp4`);

    // try to download a playable small format
    const stream = ytdl(url, {
      filter: (f) => f.container === "mp4" && f.hasAudio && f.hasVideo && f.qualityLabel === "360p",
      quality: "18",
      requestOptions: { maxReconnects: 5 },
    });

    const writer = fs.createWriteStream(videoPath);
    stream.pipe(writer);

    writer.on("finish", async () => {
      const caption = `🎵 ${title}\n👤 ${author}\n⏱️ ${duration}\n👁️ ${views}\n📅 ${uploaded}`;
      await api.sendMessage(
        { body: caption, attachment: fs.createReadStream(videoPath) },
        threadID,
        () => {
          fs.unlinkSync(videoPath);
        }
      );
    });

    stream.on("error", (err) => {
      console.error("Download error:", err.message);
      api.sendMessage("❌ Could not download video (format restricted).", threadID, messageID);
    });
  } catch (e) {
    console.error(e);
    api.sendMessage("⚠️ Error fetching video. Try again later.", threadID, messageID);
  }
};