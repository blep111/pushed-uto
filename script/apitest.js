const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "apitest",
  version: "1.1.0",
  role: 0,
  hasPrefix: false,
  aliases: ["fetchapi", "apitest"],
  description: "Fetch and display the response directly from a provided API URL (includes media if available)",
  usage: "api <api_url>",
  credits: "Xren",
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  // Require a valid API URL
  if (!args[0]) {
    return api.sendMessage(
      "⚠️ Please provide a valid API URL.\n\nExample:\napi https://api-rynxzei.onrender.com/api/birdfact",
      threadID,
      messageID
    );
  }

  const url = args[0].trim();

  if (!/^https?:\/\//i.test(url)) {
    return api.sendMessage("❌ Invalid URL. Must start with http:// or https://", threadID, messageID);
  }

  await api.sendMessage("⏳ Fetching data from the provided API URL...", threadID, messageID);

  try {
    const res = await axios.get(url, { timeout: 15000 });
    const data = res.data;

    if (!data) {
      return api.sendMessage("⚠️ The API returned no data.", threadID, messageID);
    }

    // Detect creator and remove it from main object
    const creator = data.creator ? data.creator : null;
    if (data.creator) delete data.creator;

    // Find potential media URLs in response
    const findMediaUrls = (obj) => {
      const urls = [];
      const search = (value) => {
        if (typeof value === "string") {
          if (/\.(jpg|jpeg|png|gif|mp4|webm|mov|mkv)$/i.test(value)) {
            urls.push(value);
          }
        } else if (typeof value === "object" && value !== null) {
          Object.values(value).forEach(search);
        }
      };
      search(obj);
      return urls;
    };

    const mediaUrls = findMediaUrls(data);
    const attachments = [];

    // Download and save media files temporarily
    for (const [i, mediaUrl] of mediaUrls.entries()) {
      try {
        const ext = path.extname(mediaUrl).split("?")[0] || ".jpg";
        const filePath = path.join(__dirname, `cache/api_media_${event.senderID}_${i}${ext}`);
        const response = await axios.get(mediaUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(filePath, response.data);
        attachments.push(fs.createReadStream(filePath));
      } catch (err) {
        console.warn("❌ Failed to download media:", mediaUrl);
      }
    }

    // Format JSON output
    const formatObject = (obj, indent = 0) => {
      let str = "";
      const space = "  ".repeat(indent);
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "object" && value !== null) {
          str += `🔹 ${key}: {\n${formatObject(value, indent + 1)}${space}}\n`;
        } else {
          str += `🔹 ${key}: ${value}\n`;
        }
      }
      return str;
    };

    let formatted = typeof data === "object" ? formatObject(data) : data.toString();
    if (formatted.length > 20000)
      formatted = formatted.slice(0, 20000) + "\n\n[...truncated for length...]";

    // Determine success or failed
    const statusText =
      data.status === true || data.success === true
        ? "✅ Status: Success"
        : "❌ Status: Failed";

    let message = `📡 API Response:\n\n${statusText}\n\n${formatted}`;
    if (creator) message += `\n👤 Creator: ${creator}`;

    // Send formatted response with media if exists
    await api.sendMessage(
      {
        body: message,
        attachment: attachments.length > 0 ? attachments : null,
      },
      threadID,
      async () => {
        // Cleanup cache
        attachments.forEach((file) => {
          const filePath = file.path;
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
      },
      messageID
    );
  } catch (err) {
    console.error("Error fetching API:", err.message);
    let errorMsg = "❌ Failed to fetch the provided API link.";
    if (err.response)
      errorMsg += `\n\nStatus: ${err.response.status} ${err.response.statusText}`;
    await api.sendMessage(errorMsg, threadID, messageID);
  }
};