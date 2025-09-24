const axios = require('axios');

module.exports.config = {
  name: 'ai',
  version: '1.0.0',
  role: 0,
  hasPrefix: false,
  aliases: ['assistant', 'ask'],
  description: "Chat with ChatGPT-4 API",
  usage: "chatgpt [your question]",
  credits: 'Vern',
  cooldown: 3,
};

module.exports.run = async function({ api, event, args }) {
  const promptText = args.join(" ").trim();
  const userReply = event.messageReply?.body || '';
  const finalPrompt = `${userReply} ${promptText}`.trim();
  const senderID = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!finalPrompt) {
    return api.sendMessage("❌ Please provide a prompt or reply to a message.", threadID, messageID);
  }

  api.sendMessage('🤖 𝗩-𝗔𝗦𝗦𝗜𝗦𝗧𝗔𝗡𝗧 is processing your request...', threadID, async (err, info) => {
    if (err) return;

    try {
      const { data } = await axios.get("https://xvi-rest-api.vercel.app/api/chatgpt4", {
        params: { prompt: finalPrompt }
      });

      const responseText = data.response || "❌ No response received from ChatGPT-4.";

      // Get user's name for better UX
      api.getUserInfo(senderID, (err, infoUser) => {
        const userName = infoUser?.[senderID]?.name || "Unknown User";
        const timePH = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
        const replyMessage = `🤖 𝗩-𝗔𝗦𝗦𝗜𝗦𝗧𝗔𝗡𝗧\n━━━━━━━━━━━━━━━━━━\n${responseText}\n━━━━━━━━━━━━━━━━━━\n🗣 𝗔𝘀𝗸𝗲𝗱 𝗯𝘆: ${userName}\n⏰ 𝗧𝗶𝗺𝗲: ${timePH}`;

        api.editMessage(replyMessage, info.messageID);
      });

    } catch (error) {
      console.error("ChatGPT API Error:", error);
      const errMsg = "❌ Error: " + (error.response?.data?.message || error.message || "Unknown error occurred.");
      api.editMessage(errMsg, info.messageID);
    }
  });
};