const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "spotify",
  version: "1.3.2",
  role: 0,
  hasPrefix: false,
  aliases: [],
  description: "Fetch and send Spotify song (cover + audio).",
  usage: "spotify [song name]",
  credits: "Gab",
  cooldown: 3,
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

  const songName = encodeURIComponent(args.join(" "));
  const apiURL = `https://api-library-kohi.onrender.com/api/spotify?song=${songName}`;

  await api.sendMessage("🎧 Fetching your Spotify track, please wait...", threadID, messageID);

  const fetchSong = async () => {
    try {
      const res = await axios.get(apiURL, { timeout: 15000 }); // 15s timeout
      return res.data;
    } catch (err) {
      if (err.response && err.response.status === 504) {
        console.warn("⚠️ API timed out, retrying...");
        await new Promise(r => setTimeout(r, 3000));
        return fetchSong(); // Retry once
      } else {
        throw err;
      }
    }
  };

  try {
    const result = await fetchSong();

    if (!result || !result.status || !result.data) {
      return api.sendMessage("❌ No result found or API error.", threadID, messageID);
    }

    const { title, artist, thumbnail, audioUrl, duration } = result.data;

    if (!audioUrl) {
      return api.sendMessage("❌ Audio URL not found.", threadID, messageID);
    }

    const imgPath = path.join(__dirname, "cache", `cover_${senderID}.jpg`);
    const audioPath = path.join(__dirname, "cache", `track_${senderID}.mp3`);

    // Download cover
    if (thumbnail) {
      const imgRes = await axios.get(thumbnail, { responseType: "arraybuffer" });
      fs.writeFileSync(imgPath, imgRes.data);
    }

    // Download audio
    const audioRes = await axios.get(audioUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(audioPath, audioRes.data);

    // Send cover and info
    api.sendMessage(
      {
        body: `🎵 Title: ${title}\n👤 Artist: ${artist}\n⏱ Duration: ${duration || "Unknown"}`,
        attachment: fs.existsSync(imgPath) ? fs.createReadStream(imgPath) : undefined,
      },
      threadID,
      () => {
        api.sendMessage(
          {
            body: "🎧 Here’s your Spotify track!",
            attachment: fs.createReadStream(audioPath),
          },
          threadID,
          () => {
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
          }
        );
      }
    );
  } catch (err) {
    console.error("❌ Spotify command error:", err);
    return api.sendMessage(
      `❌ An error occurred while fetching the song.\n\nError: ${err.message}`,
      threadID,
      messageID
    );
  }
};