const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "spotify",
  version: "1.1.0",
  role: 0,
  hasPrefix: false,
  aliases: [],
  description: "Search and download Spotify music.",
  usage: "spotify [song name]",
  credits: "Gab",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!args[0]) {
    return api.sendMessage(
      "❌ Please provide a song name.\n\nUsage: spotify [song name]",
      threadID,
      messageID
    );
  }

  const query = encodeURIComponent(args.join(" "));
  const apiURL = `https://ace-rest-api.onrender.com/api/spotify?search=${query}`;

  await api.sendMessage("🎧 Searching Spotify, please wait...", threadID, messageID);

  try {
    const response = await axios.get(apiURL);
    const data = response.data;

    if (!data || !data.title || !data.downloadUrl) {
      return api.sendMessage("❌ No result found for that song.", threadID, messageID);
    }

    // Create cache folder if missing
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const imgPath = path.join(cacheDir, `thumb_${senderID}.jpg`);
    const audioPath = path.join(cacheDir, `audio_${senderID}.mp3`);

    // Download thumbnail
    const thumbRes = await axios.get(data.thumbnail, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, thumbRes.data);

    // Download audio
    const audioRes = await axios.get(data.downloadUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(audioPath, audioRes.data);

    // Send details first
    api.sendMessage(
      {
        body: `🎵 Title: ${data.title}\n👤 Artist: ${data.artist || "Unknown"}\n💽 Album: ${data.album || "N/A"}`,
        attachment: fs.createReadStream(imgPath),
      },
      threadID,
      () => {
        // Then send the audio
        api.sendMessage(
          {
            body: "🎶 Here's your Spotify track!",
            attachment: fs.createReadStream(audioPath),
          },
          threadID,
          () => {
            // Clean up files
            fs.unlinkSync(imgPath);
            fs.unlinkSync(audioPath);
          }
        );
      }
    );
  } catch (err) {
    console.error("Spotify command error:", err);
    return api.sendMessage("❌ An error occurred while fetching the song.", threadID, messageID);
  }
};