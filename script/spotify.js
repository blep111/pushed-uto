const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "spotify",
  version: "1.1.0",
  role: 0,
  hasPrefix: false,
  aliases: [],
  description: "Search and download Spotify track.",
  usage: "spotify [song name]",
  credits: "Gab",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;

  if (!args[0]) {
    return api.sendMessage(
      "❌ Please provide a song name.\n\nUsage: spotify [song name]",
      threadID,
      messageID
    );
  }

  const keyword = encodeURIComponent(args.join(" "));
  const apiURL = `https://api-library-kohi.onrender.com/api/spotify?song=${keyword}`;

  await api.sendMessage("🎧 Fetching your song, please wait...", threadID, messageID);

  try {
    const response = await axios.get(apiURL);
    const data = response.data;

    if (!data || !data.url) {
      return api.sendMessage("❌ No Spotify track found.", threadID, messageID);
    }

    const { title, artist, thumbnail, url } = data;

    const imgPath = path.join(__dirname, "cache", `thumb_${senderID}.jpg`);
    const audioPath = path.join(__dirname, "cache", `audio_${senderID}.mp3`);

    // Download thumbnail
    const imgRes = await axios.get(thumbnail, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, imgRes.data);

    // Download audio
    const audioRes = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(audioPath, audioRes.data);

    // Send song info + thumbnail
    api.sendMessage(
      {
        body: `🎵 Title: ${title}\n👤 Artist: ${artist}`,
        attachment: fs.createReadStream(imgPath),
      },
      threadID,
      () => {
        // Then send the audio file
        api.sendMessage(
          {
            body: "🎧 Here's your Spotify track!",
            attachment: fs.createReadStream(audioPath),
          },
          threadID,
          () => {
            // Clean up cache
            fs.unlinkSync(imgPath);
            fs.unlinkSync(audioPath);
          }
        );
      }
    );
  } catch (error) {
    console.error("Spotify command error:", error);
    return api.sendMessage("❌ An error occurred while processing your request.", threadID, messageID);
  }
};