const axios = require("axios");

module.exports.config = {
  name: "apitest",
  version: "1.0.4",
  role: 0,
  hasPrefix: false,
  aliases: ["fetchapi", "apitest"],
  description: "Fetch and display the response directly from a provided API URL",
  usage: "api <api_url>",
  credits: "DeansG Mangubat",
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  // ✅ Require a valid URL
  if (!args[0]) {
    return api.sendMessage(
      "⚠️ Please provide a valid API URL.\n\nExample:\napi https://api-rynxzei.onrender.com/api/birdfact",
      threadID,
      messageID
    );
  }

  const url = args[0].trim();

  // ✅ Check format
  if (!/^https?:\/\//i.test(url)) {
    return api.sendMessage("❌ Invalid URL. Must start with http:// or https://", threadID, messageID);
  }

  // Notify user
  await api.sendMessage("⏳ Fetching data from the provided API URL...", threadID, messageID);

  try {
    // ✅ Fetch user-provided API directly
    const res = await axios.get(url, { timeout: 10000 });

    if (!res.data) {
      return api.sendMessage("⚠️ The API returned no response.", threadID, messageID);
    }

    let data = res.data;

    // ✅ Remove only the top-level "creator" key
    if (data.creator) {
      delete data.creator;
    }

    // ✅ Format object neatly
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

    let formatted =
      typeof data === "object" ? formatObject(data) : data.toString();

    if (formatted.length > 20000)
      formatted =
        formatted.slice(0, 20000) + "\n\n[...truncated for length...]";

    await api.sendMessage(`📡 API Response:\n\n${formatted}`, threadID, messageID);

  } catch (err) {
    console.error("Error fetching API:", err.message);
    let errorMsg = "❌ Failed to fetch the provided API link.";
    if (err.response)
      errorMsg += `\n\nStatus: ${err.response.status} ${err.response.statusText}`;
    await api.sendMessage(errorMsg, threadID, messageID);
  }
};