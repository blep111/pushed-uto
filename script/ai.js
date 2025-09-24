const axios = require('axios');

module.exports.config = {
  name: 'gpt',
  version: '1.0.0',
  role: 0,
  hasPrefix: false,
  aliases: ['gpt4', 'ask'],
  description: "Ask a question",
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

  api.sendMessage('🤖 𝗖𝗵𝗮𝘁𝗚𝗣𝗧-𝟰 𝗶𝘀 𝗽𝗿𝗼𝗰𝗲𝘀𝘀𝗶𝗻𝗴 𝘆𝗼𝘂𝗿 𝗿𝗲𝗾𝘂𝗲𝘀𝘁...', threadID, async (err, info) => {
    if (err) return;

    try {
      const { data } = await axios.get("https://xvi-rest-api.vercel.app/api/chatgpt4", {
        params: {
          prompt: finalPrompt
        }
      });

      const responseText = data.response || "❌ No response received from ChatGPT-4.";

      // Optional: Get user's name
      api.getUserInfo(senderID, (err, infoUser) => {
        const userName = infoUser?.[senderID]?.name || "Unknown User";
        const timePH = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
        const replyMessage = `🤖 𝗖𝗵𝗮𝘁𝗚𝗣𝗧-𝟰 𝗔𝗦𝗦𝗜𝗦𝗧𝗔𝗡𝗧\n━━━━━━━━━━━━━━━━━━\n${responseText}\n━━━━━━━━━━━━━━━━━━\n🗣 𝗔𝘀𝗸𝗲𝗱 𝗯𝘆: ${userName}\n⏰ 𝗧𝗶𝗺𝗲: ${timePH}`;

        api.editMessage(replyMessage, info.messageID);
      });

    } catch (error) {
      console.error("ChatGPT API Error:", error);
      const errMsg = "❌ Error: " + (error.response?.data?.message || error.message || "Unknown error occurred.");
      api.editMessage(errMsg, info.messageID);
    }
  });
};