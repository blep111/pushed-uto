const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "aes",
  version: "1.1.0",
  role: 0,
  aliases: ["aesth"],
  description: "Generate aesthetic styled image using API",
  usage: "<text> | <author> | <color>",
  credits: "Xren",
  cooldown: 3,
};

module.exports.run = async function({ api, event, args }) {
  const input = args.join(" ").split("|").map(v => v.trim());
  const text = input[0] || "Hello World";
  const author = input[1] || "Xren";
  const color = input[2] || "white";

  const apiUrl = `https://api.ccprojectsapis-jonell.gleeze.com/api/aesthetic?text=${encodeURIComponent(text)}&author=${encodeURIComponent(author)}&color=${encodeURIComponent(color)}`;

  const msg = await api.sendMessage("🎨 Generating aesthetic image...", event.threadID);

  try {
    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

    // Save the image temporarily
    const imgPath = path.join(__dirname, `/cache/aesthetic_${event.senderID}.png`);
    fs.writeFileSync(imgPath, response.data);

    await api.sendMessage({
      body: `✨ Aesthetic Image Generated!\n\n🖊 Text: ${text}\n👤 Author: ${author}\n🎨 Color: ${color}\n\nCredits: Xren`,
      attachment: fs.createReadStream(imgPath)
    }, event.threadID, () => fs.unlinkSync(imgPath), msg.messageID);

  } catch (error) {
    console.error("❌ Error fetching API:", error.message);
    api.sendMessage("❌ Failed to generate the aesthetic image.\nCheck your input or API availability.", event.threadID, msg.messageID);
  }
};