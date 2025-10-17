const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "soundcloudaudio",
  version: "1.0.1",
  role: 0,
  hasPrefix: false,
  aliases: ["sca", "soundcloudmp3"],
  description: "Search SoundCloud and send the first track as MP3",
  usage: "soundcloudaudio [track title]",
  credits: "You",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!args[0]) {
    return api.sendMessage(
      "❌ Please provide a track title.\n\nUsage: soundcloudaudio [track title]",
      threadID,
      messageID
    );
  }

  const query = encodeURIComponent(args.join(" "));
  const searchURL = `https://kaiz-apis.gleeze.com/api/soundcloud-search?title=${query}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

  await api.sendMessage("🔍 Searching SoundCloud, please wait...", threadID, messageID);

  try {
    const searchRes = await axios.get(searchURL);
    const results = searchRes.data.results;

    if (!results || results.length === 0) {
      return api.sendMessage("❌ No track found.", threadID, messageID);
    }

    // Get the first track
    const track = results[0];
    const { title, url, artist, thumbnail, duration, plays, uploaded } = track;

    if (!url) {
      return api.sendMessage("❌ Could not fetch audio URL.", threadID, messageID);
    }

    // Prepare cache folder
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const audioPath = path.join(cacheDir, `audio_${senderID}.mp3`);
    const imgPath = path.join(cacheDir, `thumb_${senderID}.jpg`);

    // Download thumbnail
    try {
      const imgRes = await axios.get(thumbnail, { responseType: "arraybuffer" });
      fs.writeFileSync(imgPath, imgRes.data);
    } catch (errThumb) {
      console.warn("Could not download artwork:", errThumb);
    }

    // Download audio
    const audioRes = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(audioPath, audioRes.data);

    // Send thumbnail + audio
    await api.sendMessage(
      {
        body: `🎵 Title: ${title}\n👤 Artist: ${artist}\n⏱ Duration: ${duration}\n🔊 Plays: ${plays}\n📤 Uploaded: ${uploaded}`,
        attachment: fs.existsSync(imgPath) ? fs.createReadStream(imgPath) : null,
      },
      threadID,
      () => {
        api.sendMessage(
          {
            body: "🎧 Here’s your track!",
            attachment: fs.createReadStream(audioPath),
          },
          threadID,
          () => {
            // Cleanup
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
          }
        );
      }
    );
  } catch (err) {
    console.error("SoundCloud audio command error:", err);
    return api.sendMessage(
      "❌ An error occurred while fetching the SoundCloud track. Please try again later.",
      threadID,
      messageID
    );
  }
};