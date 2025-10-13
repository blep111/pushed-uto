const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "cosplay",
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  aliases: ["cosplayvid", "cosplayvideo"],
  description: "Get a cosplay video from the Cosplay API.",
  usage: "cosplay",
  credits: "Nax",
  cooldown: 10,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  const apiUrl = "https://ace-rest-api.onrender.com/api/cosplay";

  try {
    // Call the API
    const resp = await axios.get(apiUrl);
    const data = resp.data;
    if (!data || !data.videoUrl) {
      return api.sendMessage("❌ Could not get cosplay video.", threadID, messageID);
    }

    // Download the video
    const videoResp = await axios.get(data.videoUrl, { responseType: "stream" });
    const ext = path.extname(data.videoUrl).split("?")[0] || ".mp4";
    const fileName = `${messageID}-cosplay${ext}`;
    const filePath = path.join(__dirname, fileName);

    const writer = fs.createWriteStream(filePath);
    videoResp.data.pipe(writer);

    writer.on("finish", async () => {
      await api.sendMessage(
        {
          body: "🎥 Cosplay Video",
          attachment: fs.createReadStream(filePath),
        },
        threadID,
        () => fs.unlink(filePath, () => {}),
        messageID
      );
    });

    writer.on("error", (err) => {
      console.error("File write error:", err);
      api.sendMessage("❌ Error downloading cosplay video.", threadID, messageID);
    });

  } catch (err) {
    console.error("Cosplay API error:", err);
    return api.sendMessage("❌ Failed to get cosplay video. Please try again later.", threadID, messageID);
  }
};