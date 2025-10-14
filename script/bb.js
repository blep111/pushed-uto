const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'bb',
  version: '1.0.0',
  role: 0,
  aliases: ['cityboard', 'board'],
  description: 'Generate a city billboard photo of mentioned user using Betadash API',
  usage: '@mention (optional)',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, mentions, senderID } = event;

  // Get mentioned user ID or use sender’s own ID
  const mentionUID = Object.keys(mentions)[0] || senderID;

  // API endpoint
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/city-billboard?userid=${mentionUID}`;

  // Send initial loading message
  api.sendMessage(
    `🖼️ Generating City Billboard for user ID: ${mentionUID}...\nPlease wait...`,
    threadID,
    async (err, info) => {
      if (err) return;

      try {
        // Fetch image from API (binary response)
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 45000 });

        // Save image temporarily
        const filePath = path.join(__dirname, `billboard_${mentionUID}.png`);
        await fs.writeFile(filePath, Buffer.from(response.data), 'binary');

        // Send generated image
        await api.sendMessage(
          {
            body: `✅ City Billboard generated successfully!`,
            attachment: fs.createReadStream(filePath),
          },
          threadID,
          async () => {
            // Cleanup temporary file
            await fs.remove(filePath).catch(() => {});
            // Delete loading message
            api.deleteMessage(info.messageID);
          }
        );
      } catch (error) {
        console.error('Error generating billboard:', error);
        api.editMessage(
          '❌ Failed to generate the City Billboard. Please try again later.',
          info.messageID
        );
      }
    }
  );
};