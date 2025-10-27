const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "spotify",
  version: "1.3.0",
  role: 0,
  hasPrefix: false,
  aliases: [],
  description: "Fetch and send Spotify song (cover + audio).",
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

  const songName = encodeURIComponent(args.join(" "));
  const apiURL = `https://api-library-kohi.onrender.com/api/spotify?song=${songName}`;

  await api.sendMessage("🎧 Fetching your Spotify track, please wait...", threadID, messageID);

  try {
    const res = await axios.get(apiURL);
    const data = res.data;

    if (!data.status || !data.data || !data.data.audioUrl) {
      return api.sendMessage("❌ No song found or API error.", threadID, messageID);
    }

    const { title, artist, thumbnail, audioUrl, duration } = data.data;

    const imgPath = path.join(__dirname, "cache", `cover_${senderID}.jpg`);
    const audioPath = path.join(__dirname, "cache", `track_${senderID}.mp3`);

    // Download thumbnail
    if (thumbnail) {
      const imgRes = await axios.get(thumbnail, { responseType: "arraybuffer" });
      fs.writeFileSync(imgPath, imgRes.data);
    }

    // Download audio
    const audioRes = await axios.get(audioUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(audioPath, audioRes.data);

    // Send cover with song info
    api.sendMessage(
      {
        body: `🎵 Title: ${title}\n👤 Artist: ${artist}\n⏱ Duration: ${duration}`,
        attachment: thumbnail ? fs.createReadStream(imgPath) : undefined,
      },
      threadID,
      () => {
        // Then send audio file
        api.sendMessage(
          {
            body: "🎧 Here’s your Spotify track!",
            attachment: fs.createReadStream(audioPath),
          },
          threadID,
          () => {
            // Clean up files after sending
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
          }
        );
      }
    );
  } catch (err) {
    console.error("Spotify command error:", err);
    return api.sendMessage("❌ An error occurred while fetching the song.", threadID, messageID);
  }
};