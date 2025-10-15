const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'blink',
  version: '1.0.1',
  role: 0,
  aliases: ['blinkpic'],
  description: 'Generate a Blink-style image of a user using Betadash API',
  usage: '@mention (optional)',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID, mentions } = event;

  // Determine if user already mentioned someone
  let targetUID = Object.keys(mentions || {})[0];

  if (!targetUID) {
    // Ask user for input if not provided
    return api.sendMessage(
      '✨ Please reply with the user ID or mention the user you want to generate the Blink image for.',
      threadID,
      (err, info) => {
        if (err) return;
        // Listen for reply
        const handleReply = async (replyEvent) => {
          if (replyEvent.threadID !== threadID) return;
          if (!replyEvent.messageReply && (!replyEvent.args || replyEvent.args.length === 0)) return;

          // Determine target from reply
          targetUID = replyEvent.messageReply?.senderID || replyEvent.args?.[0];

          if (!targetUID) {
            api.sendMessage('❌ Invalid input. Please provide a user ID or mention.', threadID);
            return;
          }

          // Remove listener after getting input
          api.removeListener('message', handleReply);

          // Generate image after receiving target UID
          await generateBlinkImage(api, threadID, targetUID, messageID);
        };

        api.on('message', handleReply);
      },
      messageID
    );
  } else {
    // If mention exists, directly generate
    await generateBlinkImage(api, threadID, targetUID, messageID);
  }
};

// Function to generate Blink image
async function generateBlinkImage(api, threadID, targetUID, replyMessageID) {
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/blink?userid=${targetUID}`;

  const loadingMsg = await api.sendMessage(`✨ Generating Blink image for user ID: ${targetUID}...\nPlease wait...`, threadID);

  try {
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 60000 });

    const filePath = path.join(__dirname, `blink_${targetUID}.png`);
    await fs.writeFile(filePath, response.data);

    await api.sendMessage(
      {
        body: `✅ Blink image generated successfully! 👤 User ID: ${targetUID}`,
        attachment: fs.createReadStream(filePath),
      },
      threadID,
      async () => {
        await fs.remove(filePath).catch(() => {});
        await api.deleteMessage(loadingMsg.messageID);
      },
      replyMessageID
    );
  } catch (error) {
    console.error('Error generating Blink image:', error);
    await api.editMessage('❌ Failed to generate Blink image. Please try again later.', loadingMsg.messageID);
  }
}