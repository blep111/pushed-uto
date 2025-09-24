const axios = require("axios");

module.exports.config = {
  name: "gemini",
  version: "1.0.2",
  role: 0,
  credits: "Vern",
  description: "Ask the Gemini AI a question and get a thoughtful answer.",
  commandCategory: "ai",
  usages: "gemini [question]",
  cooldowns: 5,
  hasPrefix: true
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const prompt = args.join(" ");

  if (!prompt) {
    return api.sendMessage(
      "❓ Please provide a question to ask Gemini.\n\nUsage: gemini What is love?",
      threadID,
      messageID
    );
  }

  try {
    // ✅ Try POST (most Gemini APIs require POST)
    const res = await axios.post("https://aryanapi.up.railway.app/api/gemini", { prompt });

    // ✅ Adjust based on likely response format
    const answer =
      res.data?.response ||
      res.data?.result ||
      res.data?.answer ||
      res.data?.text ||
      res.data?.message;

    if (!answer) {
      return api.sendMessage(
        "⚠️ No response received from Gemini. Try again later.",
        threadID,
        messageID
      );
    }

    const maxLen = 1200;
    const output = answer.length > maxLen ? answer.slice(0, maxLen) + "..." : answer;

    return api.sendMessage(
      `🤖 𝗚𝗲𝗺𝗶𝗻𝗶 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲:\n\n${output}`,
      threadID,
      messageID
    );
  } catch (err) {
    const errorMsg = err.response?.data?.error || err.message;
    console.error("[gemini.js] API Error:", errorMsg);
    return api.sendMessage(
      `🚫 Failed to reach Gemini API.\nError: ${errorMsg}`,
      threadID,
      messageID
    );
  }
};