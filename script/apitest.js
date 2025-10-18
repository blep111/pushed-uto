const axios = require("axios");

module.exports.config = {
  name: "apitest",
  version: "1.1.1",
  role: 0,
  hasPrefix: false,
  aliases: ["fetchapi", "apitest"],
  description: "Fetch API response. If media URLs, send URLs only. If text, send text.",
  usage: "api <api_url>",
  credits: "Xren",
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

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
      return api.sendMessage("⚠️ The API returned no response.", threadID, messageID);
    }

    // Determine success or failed
    const statusText =
      data.status === true || data.success === true
        ? "✅ Status: Success"
        : "❌ Status: Failed";

    // Extract creator if exists
    const creator = data.creator ? data.creator : null;
    if (data.creator) delete data.creator;

    // Helper to find media URLs in the response
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

    // Decide what to send
    let message = `${statusText}`;
    if (creator) message += `\n👤 Creator: ${creator}`;

    if (mediaUrls.length > 0) {
      // Only display media URLs
      message += `\n\n📎 Media URLs:\n${mediaUrls.join("\n")}`;
    } else if (typeof data === "object") {
      // Format JSON for text data
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
      message += `\n\n${formatObject(data)}`;
    } else {
      // Send as string if not object
      message += `\n\n${data.toString()}`;
    }

    await api.sendMessage(message, threadID, messageID);
  } catch (err) {
    console.error("Error fetching API:", err.message);
    let errorMsg = "❌ Failed to fetch the provided API link.";
    if (err.response)
      errorMsg += `\nStatus: ${err.response.status} ${err.response.statusText}`;
    await api.sendMessage(errorMsg, threadID, messageID);
  }
};