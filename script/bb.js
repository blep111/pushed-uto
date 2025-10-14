const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'bb',
  version: '2.0.0',
  role: 0,
  aliases: ['cityboard', 'board'],
  description: 'Generate a City Billboard image for any user ID or mentioned user using Betadash API',
  usage: '@mention | <uid> | (no args for self)',
  credits: 'Nax + Vern',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, mentions, senderID } = event;

  // Determine which user ID to use
  let targetUID;

  if (Object.keys(mentions).length > 0) {
    targetUID = Object.keys(mentions)[0];
  } else if (args.length > 0 && /^\d+$/.test(args[0])) {
    targetUID = args[0]; // manually entered UID
  } else {
    targetUID = senderID; // default to sender
  }

  // Betadash API endpoint
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/city-billboard?userid=${targetUID}`;

  // Send loading message
  api.sendMessage(
    `🖼️ Generating City Billboard for user ID: ${targetUID}\n⏳ Please wait...`,
    threadID,
    async (err, info) => {
      if (err) return;

      try {
        // Fetch image data from API
        const response = await axios.get(apiUrl, {
          responseType: 'arraybuffer',
          timeout: 60000,
        });

        // Save image temporarily
        const filePath = path.join(__dirname, `cache_billboard_${targetUID}.png`);
        await fs.writeFile(filePath, Buffer.from(response.data));

        // Send generated image
        await api.sendMessage(
          {
            body: `✅ City Billboard generated successfully for UID: ${targetUID}`,
            attachment: fs.createReadStream(filePath),
          },
          threadID,
          async () => {
            // Clean up temporary file
            await fs.remove(filePath).catch(() => {});
            api.deleteMessage(info.messageID);
          },
          messageID
        );
      } catch (error) {
        console.error('❌ Error generating billboard:', error);
        api.editMessage(
          '❌ Failed to generate City Billboard. The API might be busy or invalid UID provided.',
          info.messageID
        );
      }
    }
  );
};