const axios = require('axios');

module.exports.config = {
  name: 'gpt',
  version: '1.0.0',
  role: 0,
  hasPrefix: false,
  aliases: ['gpt', 'gimage'],
  description: "Analyze question or Vision",
  usage: "gpt [question] or reply to an image",
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

  if (!finalPrompt && !event.messageReply?.attachments?.[0]?.url) {
    return api.sendMessage("❌ Please provide a prompt or reply to an image.", threadID, messageID);
  }

  api.sendMessage('🤖 𝗔𝗜 𝗜𝗦 𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗜𝗡𝗚 𝗬𝗢𝗨𝗥 𝗥𝗘𝗤𝗨𝗘𝗦𝗧...', threadID, async (err, info) => {
    if (err) return;

    try {
      let imageUrl = "";
      if (event.messageReply?.attachments?.[0]?.type === 'photo') {
        imageUrl = event.messageReply.attachments[0].url;
      }

      const { data } = await axios.get("https://xvi-rest-api.vercel.app/api/chatgpt4", {
        params: {
          ask: finalPrompt,
          imagurl: imageUrl
        }
      });

      const responseText = data.description || "❌ No response received from AI.";

      // Optional: Get user's name
      api.getUserInfo(senderID, (err, infoUser) => {
        const userName = infoUser?.[senderID]?.name || "Unknown User";
        const timePH = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
        const replyMessage = `🤖 𝗔𝗜 𝗔𝗦𝗦𝗜𝗦𝗧𝗔𝗡𝗧\n━━━━━━━━━━━━━━━━━━\n${responseText}\n━━━━━━━━━━━━━━━━━━\n🗣 𝗔𝘀𝗸𝗲𝗱 𝗕𝘆: ${userName}\n⏰ 𝗧𝗶𝗺𝗲: ${timePH}`;

        api.editMessage(replyMessage, info.messageID);
      });

    } catch (error) {
      console.error("AI Error:", error);
      const errMsg = "❌ Error: " + (error.response?.data?.message || error.message || "Unknown error occurred.");
      api.editMessage(errMsg, info.messageID);
    }
  });
};