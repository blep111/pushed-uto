const axios = require("axios");

module.exports.config = {
  name: "api",
  version: "1.0.1",
  role: 0,
  hasPrefix: false,
  aliases: ["fetchapi", "apitest"],
  description: "Fetch and display API response from a given URL",
  usage: "api <api_url>",
  credits: "Xren",
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args[0]) {
    return api.sendMessage(
      "⚠️ Please provide an API URL.\n\nExample:\napi https://api-rynxzei.onrender.com/api/birdfact",
      threadID,
      messageID
    );
  }

  const userUrl = args[0].trim();

  // Validate URL format
  if (!/^https?:\/\//i.test(userUrl)) {
    return api.sendMessage("❌ Invalid URL. Please include https:// or http://", threadID, messageID);
  }

  await api.sendMessage("⏳ Fetching API data, please wait...", threadID, messageID);

  try {
    // ✅ Correct encoding and call to Rynxzei API
    const apiUrl = `https://api-rynxzei.onrender.com/api/apitest?url=${encodeURIComponent(userUrl)}`;
    const res = await axios.get(apiUrl);

    if (!res.data) {
      return api.sendMessage("⚠️ No response from API.", threadID, messageID);
    }

    let data = res.data;
    let output = "";

    // ✅ Auto-format JSON
    if (typeof data === "object") {
      output = Object.entries(data)
        .map(([key, value]) => `🔹 ${key}: ${typeof value === "object" ? JSON.stringify(value, null, 2) : value}`)
        .join("\n");
    } else {
      output = data.toString();
    }

    // Limit very large text
    if (output.length > 20000) output = output.slice(0, 20000) + "\n\n[...truncated...]";

    await api.sendMessage(`📡 API Response:\n\n${output}`, threadID, messageID);

  } catch (err) {
    console.error(err.response?.data || err.message);
    let msg = "❌ Failed to fetch API data.";
    if (err.response?.status === 400)
      msg += "\n\n⚠️ The API URL might be invalid, inaccessible, or not returning proper data.";
    else msg += `\n\nError: ${err.message}`;
    await api.sendMessage(msg, threadID, messageID);
  }
};