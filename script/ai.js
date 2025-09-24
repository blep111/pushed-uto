const axios = require('axios');

module.exports.config = {
  name: 'ai',
  version: '1.0.1',
  role: 0,
  prefix: true,
  aliases: ['gpt', 'gimage'],
  description: "Ask AI or analyze an image.",
  usage: "ai [question] or reply to an image",
  credits: 'Vern',
  cooldowns: 3,
  category: "ai"
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

  api.sendMessage('🤖 Processing your request...', threadID, async (err, info) => {
    if (err) return;

    try {
      let imageUrl = "";
      if (event.messageReply?.attachments?.[0]?.type === 'photo') {
        imageUrl = event.messageReply.attachments[0].url;
      }

      // Call the AI API properly
      const { data } = await axios.get("https://aryanapi.up.railway.app/api/geminii", {
        params: {
          prompt: finalPrompt || "Explain this image",
          imageurl: imageUrl || ""
        }
      });

      console.log("🔎 AI Response:", data); // Debugging

      const responseText = data.description || data.result || data.response || "❌ No response received from AI.";

      // Get user name
      api.getUserInfo(senderID, (err, infoUser) => {
        const userName = (!err && infoUser?.[senderID]?.name) ? infoUser[senderID].name : "User";
        const timePH = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });

        const replyMessage = `🤖 𝗔𝗜 𝗔𝗦𝗦𝗜𝗦𝗧𝗔𝗡𝗧\n━━━━━━━━━━━━━━━━━━\n${responseText}\n━━━━━━━━━━━━━━━━━━\n🗣 𝗔𝘀𝗸𝗲𝗱 𝗕𝘆: ${userName}\n⏰ 𝗧𝗶𝗺𝗲: ${timePH}`;

        api.sendMessage(replyMessage, threadID, messageID);
      });

    } catch (error) {
      console.error("AI Error:", error.response?.data || error.message || error);
      const errMsg = "❌ Error: " + (error.response?.data?.message || error.message || "Unknown error occurred.");
      api.sendMessage(errMsg, threadID, messageID);
    }
  });
};