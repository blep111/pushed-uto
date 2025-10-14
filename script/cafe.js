const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'cafe',
  version: '1.1.0',
  role: 0,
  aliases: ['coffee', 'cafepic'],
  description: 'Generate a Café-themed photo for any user ID using Betadash API',
  usage: '@mention | <userID>',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, mentions, senderID } = event;

  // Determine target user:
  // 1. Mentioned user
  // 2. User ID provided as argument
  // 3. Fallback to sender
  const targetUID = Object.keys(mentions || {})[0] || args[0] || senderID;

  // Construct API URL
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/cafe?userid=${targetUID}`;

  // Send initial loading message
  const loadingMsg = await api.sendMessage(
    `☕ Generating Café portrait for user ID: ${targetUID}...\nPlease wait...`,
    threadID
  );

  try {
    // Fetch image from API
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 60000 });

    // Save image temporarily
    const filePath = path.join(__dirname, `cafe_${targetUID}.png`);
    await fs.writeFile(filePath, response.data);

    // Send the generated image
    await api.sendMessage(
      {
        body: `✅ Café portrait generated successfully!\n👤 User ID: ${targetUID}`,
        attachment: fs.createReadStream(filePath),
      },
      threadID
    );

    // Cleanup
    await fs.remove(filePath).catch(() => {});
    await api.deleteMessage(loadingMsg.messageID);
  } catch (error) {
    console.error('Error generating Café image:', error);
    await api.editMessage(
      '❌ Failed to generate the Café portrait. Please try again later.',
      loadingMsg.messageID
    );
  }
};