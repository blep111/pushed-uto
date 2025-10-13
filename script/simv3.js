const axios = require('axios');

// Store which threads have SimSimi auto-reply enabled
const activeSimThreads = new Set();

module.exports.config = {
  name: "simv3",
  version: "2.0.0",
  permission: 0,
  credits: "converted by vrax, upgraded by Nax",
  prefix: false,
  premium: false,
  description: "Auto-reply with SimSimi AI",
  category: "without prefix",
  usages: "sim on | sim off",
  cooldowns: 3,
  dependencies: {
    "axios": ""
  }
};

module.exports.languages = {
  "english": {
    "on": "SimSimi auto-reply activated! All messages will receive SimSimi responses.",
    "off": "SimSimi auto-reply deactivated.",
    "alreadyOn": "SimSimi auto-reply is already active in this thread.",
    "alreadyOff": "SimSimi auto-reply is not active in this thread.",
    "apiError": "Error: Failed to connect to Sim API.",
    "noResponse": "Error: No response from Sim API."
  }
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, body, senderID, isGroup } = event;
  // Only auto-reply if enabled and message isn't from the bot itself
  if (!activeSimThreads.has(threadID)) return;
  if (!body || senderID === api.getCurrentUserID()) return;

  try {
    const apiKey = "2a5a2264d2ee4f0b847cb8bd809ed34bc3309be7";
    const apiUrl = `https://simsimi.ooguy.com/sim?query=${encodeURIComponent(body)}&apikey=${apiKey}`;
    const { data } = await axios.get(apiUrl);
    if (!data || !data.respond) return;
    api.sendMessage(data.respond, threadID);
  } catch (error) {
    console.error("sim handleEvent error:", error.message);
  }
};

module.exports.run = async function({ api, event, args, getText }) {
  const { threadID, messageID } = event;
  const subcmd = (args[0] || "").toLowerCase();

  if (subcmd === "on") {
    if (activeSimThreads.has(threadID)) {
      return api.sendMessage(getText("alreadyOn"), threadID, messageID);
    }
    activeSimThreads.add(threadID);
    return api.sendMessage(getText("on"), threadID, messageID);
  }

  if (subcmd === "off") {
    if (!activeSimThreads.has(threadID)) {
      return api.sendMessage(getText("alreadyOff"), threadID, messageID);
    }
    activeSimThreads.delete(threadID);
    return api.sendMessage(getText("off"), threadID, messageID);
  }

  return api.sendMessage("📌 Usage:\nsim on — activate SimSimi auto-reply\nsim off — deactivate auto-reply", threadID, messageID);
};