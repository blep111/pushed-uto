const axios = require("axios");

const activeSessions = new Map();

function getPHTime() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
}

module.exports.config = {
  name: "ss",
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  aliases: [],
  description: "Take a screenshot of a URL via Urangkapolka API",
  usage: "screenshot <url>",
  credits: "You",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (args.length === 0) {
    return api.sendMessage("📌 Usage: screenshot <url>", threadID, messageID);
  }

  const targetUrl = args[0].trim();
  // validate URL (basic)
  if (!/^https?:\/\//i.test(targetUrl)) {
    return api.sendMessage("⚠️ Please provide a valid URL starting with http:// or https://", threadID, messageID);
  }

  // encode it properly
  const encoded = encodeURIComponent(targetUrl);
  const apiUrl = `https://urangkapolka.vercel.app/api/screenshot?url=${encoded}`;

  try {
    // get image as stream / buffer
    const resp = await axios.get(apiUrl, {
      responseType: "arraybuffer"
    });

    const imageBuffer = Buffer.from(resp.data, "binary");

    // send as attachment
    await api.sendMessage(
      { body: `📷 Screenshot of: ${targetUrl}`, attachment: imageBuffer },
      threadID,
      messageID
    );
  } catch (err) {
    console.error("Screenshot API error:", err);
    return api.sendMessage("❌ Failed to get screenshot. Please try again later.", threadID, messageID);
  }
};