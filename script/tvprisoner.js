const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "tvprisoner",
  version: "1.0.0",
  role: 0,
  credits: "Vern",
  aliases: [],
  usages: "< reply to image >",
  cooldown: 5,
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, messageReply } = event;
  const tempPath = path.join(__dirname, "cache", `tvprisoner_${Date.now()}.jpg`);

  // Ensure image is replied to
  if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage("❌ Please reply to an image to apply the TV Prisoner effect.", threadID, messageID);
  }

  const attachment = messageReply.attachments[0];
  if (attachment.type !== "photo") {
    return api.sendMessage("❌ The replied message must be a photo.", threadID, messageID);
  }

  const imageUrl = encodeURIComponent(attachment.url);
  const apiUrl = `https://kaiz-apis.gleeze.com/api/tv-prisoner?imageUrl=${imageUrl}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

  try {
    api.sendMessage("📺 Applying TV Prisoner effect, please wait...", threadID, messageID);

    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

    fs.ensureDirSync(path.dirname(tempPath));
    fs.writeFileSync(tempPath, Buffer.from(response.data, "binary"));

    api.sendMessage({
      body: "✅ TV Prisoner effect applied successfully!",
      attachment: fs.createReadStream(tempPath)
    }, threadID, () => fs.unlinkSync(tempPath), messageID);

  } catch (error) {
    console.error("TV Prisoner Error:", error.message);
    api.sendMessage("❌ An error occurred while applying the effect. Please try again later.", threadID, messageID);
  }
};