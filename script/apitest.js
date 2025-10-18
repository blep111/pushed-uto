const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "apitest",
  version: "1.3.0",
  role: 0,
  hasPrefix: false,
  aliases: ["fetchapi", "apitest"],
  description: "Fetch API URL, display success, and send media if available",
  usage: "api <api_url>",
  credits: "Xren",
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!args[0]) {
    return api.sendMessage(
      "⚠️ Please provide a valid API URL.\n\nExample:\napi https://vern-rest-api.vercel.app/api/billboard?text=hi",
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
    // Check the content-type using HEAD request
    let headRes;
    try {
      headRes = await axios.head(url, { timeout: 8000 });
    } catch (headErr) {
      headRes = await axios.get(url, { method: "GET", timeout: 10000, maxContentLength: 1, validateStatus: () => true });
    }

    const contentType = (headRes.headers && headRes.headers["content-type"])
      ? headRes.headers["content-type"].toLowerCase()
      : "";

    const statusText = "✅ Status: Success";

    // If media, download and send as attachment
    if (contentType.startsWith("image/") || contentType.startsWith("video/")) {
      const ext = contentType.split("/")[1] || "jpg";
      const filePath = path.join(__dirname, `cache/api_media_${senderID}.${ext}`);

      try {
        const mediaRes = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
        fs.writeFileSync(filePath, mediaRes.data);

        await api.sendMessage(
          {
            body: `${statusText}\n\n📎 Media URL:\n${url}`,
            attachment: fs.createReadStream(filePath),
          },
          threadID,
          () => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          },
          messageID
        );
      } catch (downloadErr) {
        console.warn("❌ Failed to download media:", downloadErr.message);
        await api.sendMessage(`${statusText}\n\n📎 Media URL:\n${url}\n\n⚠️ Failed to attach media.`, threadID, messageID);
      }

      return;
    }

    // Otherwise assume JSON/text -> fetch full response
    const res = await axios.get(url, { timeout: 15000 });
    const data = res.data;

    if (!data) {
      return api.sendMessage("⚠️ The API returned no response.", threadID, messageID);
    }

    // Extract creator if exists
    const creator = (typeof data === "object" && data.creator) ? data.creator : null;
    if (typeof data === "object" && data.creator) delete data.creator;

    // Format JSON/text
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
    if (formatted.length > 20000) formatted = formatted.slice(0, 20000) + "\n\n[...truncated for length...]";

    let finalMessage = `📡 API Response:\n\n${statusText}`;
    if (creator) finalMessage += `\n👤 Creator: ${creator}`;
    finalMessage += `\n\n${formatted}`;

    await api.sendMessage(finalMessage, threadID, messageID);

  } catch (err) {
    console.error("Error fetching API:", err.message);
    let errorMsg = "❌ Failed to fetch the provided API link.";
    if (err.response) errorMsg += `\nStatus: ${err.response.status} ${err.response.statusText}`;
    await api.sendMessage(errorMsg, threadID, messageID);
  }
};