const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "spotify",
  version: "1.2.0",
  role: 0,
  hasPrefix: false,
  aliases: [],
  description: "Search and download Spotify track.",
  usage: "spotify [song name]",
  credits: "Gab",
  cooldown: 3,
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

  await api.sendMessage("🎧 Fetching your Spotify track, please wait...", threadID, messageID);

  try {
    const response = await axios.get(apiURL);

    // Validate API response
    if (!response.data || !response.data.url) {
      return api.sendMessage("❌ No Spotify track found or API error.", threadID, messageID);
    }

    const { title, artist, thumbnail, url } = response.data;

    const imgPath = path.join(__dirname, "cache", `thumb_${senderID}.jpg`);
    const audioPath = path.join(__dirname, "cache", `audio_${senderID}.mp3`);

    // Download thumbnail
    if (thumbnail) {
      const imgRes = await axios.get(thumbnail, { responseType: "arraybuffer" });
      fs.writeFileSync(imgPath, imgRes.data);
    }

    // Download audio
    const audioRes = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(audioPath, audioRes.data);

    // Send message with song info and image
    api.sendMessage(
      {
        body: `🎵 Title: ${title}\n👤 Artist: ${artist}`,
        attachment: thumbnail ? fs.createReadStream(imgPath) : undefined,
      },
      threadID,
      () => {
        // Then send the MP3
        api.sendMessage(
          {
            body: "🎧 Here’s your Spotify track!",
            attachment: fs.createReadStream(audioPath),
          },
          threadID,
          () => {
            // Cleanup temporary files
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
          }
        );
      }
    );
  } catch (error) {
    console.error("Spotify command error:", error);
    return api.sendMessage("❌ An error occurred while fetching the track.", threadID, messageID);
  }
};