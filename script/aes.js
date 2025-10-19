const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "aes",
  version: "1.0.0",
  role: 0,
  hasPrefix: false,
  aliases: ["aestheticimg", "aestheticgen"],
  description: "Generate an aesthetic image with text, author, and color",
  usage: "aesthetic <text> | <author> | <color>",
  credits: "Xren",
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  // Example: aesthetic hello world | cc | white
  const input = args.join(" ").split("|").map(a => a.trim());

  const text = input[0];
  const author = input[1] || "Unknown";
  const color = input[2] || "white";

  if (!text) {
    return api.sendMessage(
      "⚠️ Please provide input.\n\nExample:\naesthetic hello world | cc | white",
      threadID,
      messageID
    );
  }

  const imagePath = path.join(__dirname, "cache", `aesthetic_${Date.now()}.png`);
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  try {
    api.sendMessage("🎨 Generating aesthetic image...", threadID, messageID);

    const apiURL = `https://api.ccprojectsapis-jonell.gleeze.com/api/aesthetic?text=${encodeURIComponent(text)}&author=${encodeURIComponent(author)}&color=${encodeURIComponent(color)}`;

    const response = await axios.get(apiURL, { responseType: "arraybuffer" });
    fs.writeFileSync(imagePath, response.data);

    await api.sendMessage(
      {
        body: `📸 Aesthetic Image Generated!\n\n🖋 Text: ${text}\n👤 Author: ${author}\n🎨 Color: ${color}`,
        attachment: fs.createReadStream(imagePath),
      },
      threadID,
      () => fs.unlinkSync(imagePath) // cleanup after sending
    );
  } catch (error) {
    console.error("❌ Error fetching aesthetic image:", error.message);
    api.sendMessage("❌ Failed to generate aesthetic image. Please try again.", threadID, messageID);
  }
};