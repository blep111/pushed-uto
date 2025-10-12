const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "yt",
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  aliases: ["getvideo", "ytvideo"],
  description: "Get a video from Kaiz API by query and send it to chat.",
  usage: "yt <query>",
  credits: "Kaizenji, VernesG",
  cooldown: 10,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!args.length) {
    return api.sendMessage("📌 Usage: yt <query>\nExample: yt dancing", threadID, messageID);
  }

  const query = args.join(" ").trim();
  const encoded = encodeURIComponent(query);
  const apiUrl = `https://kaiz-apis.gleeze.com/api/video?query=${encoded}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

  try {
    // Call Kaiz API
    const resp = await axios.get(apiUrl);
    const data = resp.data;
    if (!data || !data.download_url) {
      return api.sendMessage(`❌ Could not find video for: ${query}`, threadID, messageID);
    }

    // Download video file
    const downloadResp = await axios({
      method: "GET",
      url: data.download_url,
      responseType: "stream",
      headers: {
        // Some video servers require a user-agent
        "User-Agent": "Mozilla/5.0"
      }
    });

    const fileName = `${messageID}-video.mp4`;
    const filePath = path.join(__dirname, fileName);
    const writer = fs.createWriteStream(filePath);

    // Pipe the video stream to the file
    downloadResp.data.pipe(writer);

    // Handle finish and error events
    writer.on("finish", async () => {
      let msg =
        `🎬 ${data.title || "Video"}\n` +
        (data.author ? `• Author: ${data.author}\n` : "") +
        (data.duration ? `• Duration: ${data.duration}\n` : "");

      await api.sendMessage(
        {
          body: msg.trim(),
          attachment: fs.createReadStream(filePath),
        },
        threadID,
        () => fs.unlink(filePath, () => {}),
        messageID
      );
    });

    writer.on("error", (err) => {
      console.error("File write error:", err);
      api.sendMessage("❌ Error downloading video file.", threadID, messageID);
    });

  } catch (err) {
    console.error("Video API error:", err);
    return api.sendMessage("❌ Failed to get video. Please try again later.", threadID, messageID);
  }
};