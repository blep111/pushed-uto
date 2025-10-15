const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'blink',
  version: '1.0.0',
  role: 0,
  aliases: ['blinkpic'],
  description: 'Generate a Blink-style image of a user using Betadash API',
  usage: '@mention (optional)',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, mentions, senderID } = event;

  // Determine target user
  const targetUID = Object.keys(mentions || {})[0] || senderID;

  // Construct API URL
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/blink?userid=${targetUID}`;

  // Send loading message
  const loadingMsg = await api.sendMessage(
    `✨ Generating Blink image for user ID: ${targetUID}...\nPlease wait...`,
    threadID
  );

  try {
    // Fetch image from API
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 60000 });

    // Save image temporarily
    const filePath = path.join(__dirname, `blink_${targetUID}.png`);
    await fs.writeFile(filePath, response.data);

    // Send the generated image
    await api.sendMessage(
      {
        body: `✅ Blink image generated successfully! 👤 User ID: ${targetUID}`,
        attachment: fs.createReadStream(filePath),
      },
      threadID,
      async () => {
        // Cleanup
        await fs.remove(filePath).catch(() => {});
        await api.deleteMessage(loadingMsg.messageID);
      },
      messageID
    );
  } catch (error) {
    console.error('Error generating Blink image:', error);
    await api.editMessage(
      '❌ Failed to generate Blink image. Please try again later.',
      loadingMsg.messageID
    );
  }
};