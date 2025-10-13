const axios = require('axios');

const activeSimThreads = new Set();
const simBotUserID = null; // Will be set after first reply from bot

module.exports.config = {
  name: "simv3",
  version: "3.0.0",
  permission: 0,
  credits: "converted by vrax, upgraded by Copilot",
  prefix: false,
  premium: false,
  description: "Auto-reply with SimSimi AI, including thread replies",
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
  const { threadID, body, senderID, isGroup, messageReply } = event;

  // Only auto-reply if enabled and message isn't from the bot itself
  if (!activeSimThreads.has(threadID)) return;
  if (!body || senderID === api.getCurrentUserID()) return;

  // If message is a reply to the bot's previous SimSimi reply, continue the thread
  let replyContext = "";
  if (messageReply && messageReply.senderID === api.getCurrentUserID()) {
    replyContext = `\n(User replied to SimSimi: "${body}")`;
  }

  try {
    const apiKey = "2a5a2264d2ee4f0b847cb8bd809ed34bc3309be7";
    const apiUrl = `https://simsimi.ooguy.com/sim?query=${encodeURIComponent(body)}&apikey=${apiKey}`;
    const { data } = await axios.get(apiUrl);

    if (!data || !data.respond) return;

    api.sendMessage(`${data.respond}${replyContext}`, threadID, event.messageID); // reply in thread if possible
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