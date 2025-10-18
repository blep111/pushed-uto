const axios = require("axios");

module.exports.config = {
  name: "apitest",
  version: "1.0.0",
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

  // ✅ Check if URL provided
  if (!args[0]) {
    return api.sendMessage(
      "⚠️ Please provide an API URL.\n\nExample:\napi https://api-rynxzei.onrender.com/api/birdfact",
      threadID,
      messageID
    );
  }

  const url = args[0].trim();

  // ✅ Notify user
  await api.sendMessage("⏳ Fetching API data, please wait...", threadID, messageID);

  try {
    const res = await axios.get(`https://api-rynxzei.onrender.com/api/apitest?url=${encodeURIComponent(url)}`);

    // ✅ Handle JSON and text response
    let data = res.data;

    // Convert JSON to formatted string
    let output;
    if (typeof data === "object") {
      output = JSON.stringify(data, null, 2);
    } else {
      output = data.toString();
    }

    // ✅ Limit very large responses
    if (output.length > 20000) {
      output = output.substring(0, 20000) + "\n\n[...Output truncated due to size limit...]";
    }

    await api.sendMessage(`📡 API Response:\n\n${output}`, threadID, messageID);

  } catch (err) {
    console.error(err);
    await api.sendMessage(
      `❌ Failed to fetch API data.\n\nError: ${err.message || "Unknown error"}`,
      threadID,
      messageID
    );
  }
};