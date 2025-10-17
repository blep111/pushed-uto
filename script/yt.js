const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "soundcloud",
  version: "1.0.1",
  role: 0,
  hasPrefix: false,
  aliases: ["sc", "scsearch"],
  description: "Search and send a SoundCloud track via API",
  usage: "soundcloud [track title]",
  credits: "You",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!args[0]) {
    return api.sendMessage(
      "❌ Please provide a track title.\n\nUsage: soundcloud [track title]",
      threadID,
      messageID
    );
  }

  const query = encodeURIComponent(args.join(" "));
  const searchURL = `https://kaiz-apis.gleeze.com/api/soundcloud-search?title=${query}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

  await api.sendMessage("🔍 Searching SoundCloud, please wait...", threadID, messageID);

  try {
    const searchRes = await axios.get(searchURL);
    const results = searchRes.data.results; // ✅ use results array

    if (!results || results.length === 0) {
      return api.sendMessage("❌ No track found.", threadID, messageID);
    }

    // Find the first result that matches the user input (case-insensitive)
    const track = results.find(t =>
      t.title.toLowerCase().includes(args.join(" ").toLowerCase())
    ) || results[0]; // fallback to first if no exact match

    const { title, url, artist, thumbnail, duration, plays, uploaded } = track;

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const imgPath = path.join(cacheDir, `thumb_${senderID}.jpg`);

    // Download thumbnail
    try {
      const imgRes = await axios.get(thumbnail, { responseType: "arraybuffer" });
      fs.writeFileSync(imgPath, imgRes.data);
    } catch (errThumb) {
      console.warn("Could not download artwork:", errThumb);
    }

    // Send track info + thumbnail
    const msg = {
      body: `🎵 Title: ${title}\n👤 Artist: ${artist}\n⏱ Duration: ${duration}\n🔊 Plays: ${plays}\n📤 Uploaded: ${uploaded}\n🔗 Link: ${url}`,
      attachment: fs.existsSync(imgPath) ? fs.createReadStream(imgPath) : null,
    };

    api.sendMessage(msg, threadID, (err) => {
      if (err) console.error("Error sending message:", err);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); // cleanup
    });

  } catch (error) {
    console.error("SoundCloud command error:", error);
    return api.sendMessage(
      "❌ An error occurred while searching SoundCloud. Please try again later.",
      threadID,
      messageID
    );
  }
};