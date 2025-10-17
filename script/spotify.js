const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "spotify",
  version: "1.0.0",
  role: 0,
  hasPrefix: false,
  aliases: [],
  description: "Search and download Spotify track.",
  usage: "spotify [song name]",
  credits: "Vern",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;

  if (!args[0]) {
    return api.sendMessage("❌ Please provide a search keyword.\n\nUsage: spotify [song name]", threadID, messageID);
  }

  const keyword = encodeURIComponent(args.join(" "));
  const searchURL = `https://kaiz-apis.gleeze.com/api/spotify-search?q=${keyword}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

  await api.sendMessage("Traacking song please wait...", threadID, messageID);

  try {
    const searchRes = await axios.get(searchURL);
    const track = searchRes.data[0]; // First result

    if (!track || !track.trackUrl) {
      return api.sendMessage("❌ No Spotify track found.", threadID, messageID);
    }

    const downloadURL = `https://kaiz-apis.gleeze.com/api/spotify-down?url=${encodeURIComponent(track.trackUrl)}&apikey=8aa2f0a0-cbb9-40b8-a7d8-bba320cb9b10`;
    const dlRes = await axios.get(downloadURL);
    const { title, url, artist, thumbnail } = dlRes.data;

    const imgPath = path.join(__dirname, "cache", `thumb_${senderID}.jpg`);
    const audioPath = path.join(__dirname, "cache", `audio_${senderID}.mp3`);

    // Download thumbnail
    const imgRes = await axios.get(thumbnail, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, imgRes.data);

    // Download audio
    const audioRes = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(audioPath, audioRes.data);

    // Send image with details
    api.sendMessage({
      body: `🎵 Title: ${title}\n👤 Artist: ${artist}`,
      attachment: fs.createReadStream(imgPath)
    }, threadID, () => {
      // Then send the audio
      api.sendMessage({
        body: "🎧 Here’s your Spotify track!",
        attachment: fs.createReadStream(audioPath)
      }, threadID, () => {
        fs.unlinkSync(imgPath);
        fs.unlinkSync(audioPath);
      });
    });

  } catch (error) {
    console.error("Spotify command error:", error);
    return api.sendMessage("❌ An error occurred while processing your request.", threadID, messageID);
  }
};