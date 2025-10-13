const axios = require("axios");

function convertToBold(text) {
  const boldMap = {
    'a': '𝗮','b': '𝗯','c': '𝗰','d': '𝗱','e': '𝗲','f': '𝗳','g': '𝗴','h': '𝗵','i': '𝗶','j': '𝗷',
    'k': '𝗸','l': '𝗹','m': '𝗺','n': '𝗻','o': '𝗼','p': '𝗽','q': '𝗾','r': '𝗿','s': '𝘀','t': '𝘁',
    'u': '𝘂','v': '𝘃','w': '𝘄','x': '𝘅','y': '𝘆','z': '𝘇',
    'A': '𝗔','B': '𝗕','C': '𝗖','D': '𝗗','E': '𝗘','F': '𝗙','G': '𝗚','H': '𝗛','I': '𝗜','J': '𝗝',
    'K': '𝗞','L': '𝗟','M': '𝗠','N': '𝗡','O': '𝗢','P': '𝗣','Q': '𝗤','R': '𝗥','S': '𝗦','T': '𝗧',
    'U': '𝗨','V': '𝗩','W': '𝗪','X': '𝗫','Y': '𝗬','Z': '𝗭',
  };
  return text.split('').map(char => boldMap[char] || char).join('');
}

const responseOpeners = ["𝗔𝗿𝗶𝗮 𝗔𝗜"];

module.exports.config = {
  name: "aria",
  version: "1.1.1",
  role: 0,
  hasPrefix: true,
  aliases: ["ariaai", "aria1"],
  description: "Aria AI via new API.",
  usage: "aria [prompt]",
  credits: "Nax",
  cooldown: 0,
};

module.exports.run = async function ({ api, event, args }) {
  const prompt = args.join(" ");
  const threadID = event.threadID;
  const messageID = event.messageID;
  const uid = event.senderID;

  if (!prompt)
    return api.sendMessage("❗Pakilagay ng iyong sagot.", threadID, messageID);

  // Send loading message and get the info for editing later
  const loadingMsg = await new Promise(resolve =>
    api.sendMessage("🚀Generating Aria Ai..", threadID, (err, info) => resolve(info))
  );

  try {
    const { data } = await axios.get(
      "https://betadash-api-swordslush-production.up.railway.app/Aria",
      {
        params: {
          ask: prompt,
          userid: uid,
          stream: false,
        },
      }
    );

    const raw = data?.response;
    if (!raw) {
      return api.editMessage("⚠️ No response received from Aria API.", loadingMsg.messageID, threadID);
    }

    // Formatting
    const formatted = raw
      .replace(/\*\*(.*?)\*\*/g, (_, t) => convertToBold(t))
      .replace(/##(.*?)##/g, (_, t) => convertToBold(t))
      .replace(/###\s*/g, "")
      .replace(/\n{3,}/g, "\n\n");

    const opener = responseOpeners[Math.floor(Math.random() * responseOpeners.length)];
    return api.editMessage(`${opener}\n\n${formatted}`, loadingMsg.messageID, threadID);

  } catch (error) {
    console.error(error);
    return api.editMessage("❌ Error while contacting Aria API.", loadingMsg.messageID, threadID);
  }
};