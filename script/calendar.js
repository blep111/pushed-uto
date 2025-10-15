const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'calendar',
  version: '1.0.0',
  role: 0,
  aliases: ['calendarpic'],
  description: 'Generate a Calendar-style image of a user using Betadash API',
  usage: '@mention or <userID>',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, mentions, senderID } = event;

  let targetUID = Object.keys(mentions || {})[0] || null;

  // Helper function to prompt user for input
  async function promptUser(promptText, callback) {
    const loadingMsg = await api.sendMessage(promptText, threadID);

    const handleReply = async (replyEvent) => {
      if (replyEvent.threadID !== threadID) return;
      const input = replyEvent.args?.[0] || replyEvent.messageReply?.senderID;

      if (!input) {
        api.sendMessage('❌ Invalid input. Please try again.', threadID);
        return;
      }

      api.removeListener('message', handleReply);
      await api.deleteMessage(loadingMsg.messageID);
      callback(input);
    };

    api.on('message', handleReply);
  }

  // Step 1: Ask for user ID if not provided
  if (!targetUID) {
    return promptUser('📅 Please provide the user ID or mention the user for the Calendar image.', (input) => {
      targetUID = input;
      module.exports.run({ api, event });
    });
  }

  // All inputs gathered, generate image
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/calendar?userid=${targetUID}`;

  const loadingMsg = await api.sendMessage(`📆 Generating Calendar image for user ID: ${targetUID}...\nPlease wait...`, threadID);

  try {
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 60000 });

    const filePath = path.join(__dirname, `calendar_${targetUID}.png`);
    await fs.writeFile(filePath, response.data);

    await api.sendMessage(
      {
        body: `✅ Calendar image generated successfully! 👤 User ID: ${targetUID}`,
        attachment: fs.createReadStream(filePath),
      },
      threadID,
      async () => {
        await fs.remove(filePath).catch(() => {});
        await api.deleteMessage(loadingMsg.messageID);
      },
      messageID
    );
  } catch (error) {
    console.error('Error generating Calendar image:', error);
    await api.editMessage('❌ Failed to generate Calendar image. Please try again later.', loadingMsg.messageID);
  }
};