const axios = require("axios");
const { PassThrough } = require("stream"); // For proper attachment handling

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
  if (!/^https?:\/\//i.test(targetUrl)) {
    return api.sendMessage("⚠️ Please provide a valid URL starting with http:// or https://", threadID, messageID);
  }

  const encoded = encodeURIComponent(targetUrl);
  const apiUrl = `https://urangkapolka.vercel.app/api/screenshot?url=${encoded}`;

  try {
    const resp = await axios.get(apiUrl, {
      responseType: "arraybuffer"
    });

    // Validate image response
    if (
      !resp.headers["content-type"]?.startsWith("image/") ||
      resp.status !== 200
    ) {
      throw new Error("No image returned from API");
    }

    // Convert buffer to readable stream for attachment
    const imageStream = new PassThrough();
    imageStream.end(resp.data);

    await api.sendMessage(
      { body: `📷 Screenshot of: ${targetUrl}`, attachment: imageStream },
      threadID,
      messageID
    );
  } catch (err) {
    console.error("Screenshot API error:", err);
    return api.sendMessage("❌ Failed to get screenshot. Please try again later.", threadID, messageID);
  }
};