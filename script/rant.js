const axios = require("axios");

module.exports.config = {
  name: "rant",
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  aliases: ["randomrant", "rantmsg"],
  description: "Get a random rant from Ace REST API.",
  usage: "rant <topic>",
  credits: "Nax",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!args.length) {
    return api.sendMessage("📌 Usage: rant <topic>\nExample: rant school", threadID, messageID);
  }

  const query = args.join(" ").trim();
  const apiUrl = `https://ace-rest-api.onrender.com/api/rant?q=${encodeURIComponent(query)}`;

  try {
    const resp = await axios.get(apiUrl);
    const data = resp.data;
    if (!data || data.error || !data.result) {
      // If error or no result in response
      const errMsg = data?.error || "❌ No rant found!";
      return api.sendMessage(`❌ Error: ${errMsg}`, threadID, messageID);
    }

    await api.sendMessage(`🗯️ Rant about "${query}":\n\n${data.result}`, threadID, messageID);

  } catch (err) {
    console.error("Rant API error:", err);
    return api.sendMessage("❌ Failed to get rant. Please try again later.", threadID, messageID);
  }
};