const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'cafe',
  version: '1.0.0',
  role: 0,
  aliases: ['coffee', 'cafepic'],
  description: 'Generate a Café-themed photo of mentioned user using Betadash API',
  usage: '@mention (optional)',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, mentions, senderID } = event;

  // Determine target user (mentioned or sender)
  const targetUID = Object.keys(mentions)[0] || senderID;

  // Betadash API URL
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/cafe?userid=${targetUID}`;

  // Send initial loading message
  api.sendMessage(
    `☕ Generating Café portrait for user ID: ${targetUID}...\nPlease wait...`,
    threadID,
    async (err, info) => {
      if (err) return;

      try {
        // Fetch image from API as binary
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 60000 });

        // Save image temporarily
        const filePath = path.join(__dirname, `cafe_${targetUID}.png`);
        await fs.writeFile(filePath, Buffer.from(response.data), 'binary');

        // Send the generated image
        await api.sendMessage(
          {
            body: `✅ Café portrait generated successfully!\n👤 User ID: ${targetUID}`,
            attachment: fs.createReadStream(filePath),
          },
          threadID,
          async () => {
            // Remove temporary image
            await fs.remove(filePath).catch(() => {});
            // Delete loading message
            api.deleteMessage(info.messageID);
          },
          messageID
        );
      } catch (error) {
        console.error('Error generating Café image:', error);
        api.editMessage(
          '❌ Failed to generate the Café portrait. Please try again later.',
          info.messageID
        );
      }
    }
  );
};