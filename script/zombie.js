const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'zombie',
  version: '1.0.0',
  role: 0,
  aliases: ['zombify', 'zombiestyle'],
  description: 'Generate a Zombie-style image for any user using Betadash API',
  usage: '@mention | <userID>',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, mentions, senderID } = event;

  // Determine target user
  const targetUID = Object.keys(mentions || {})[0] || args[0] || senderID;

  // Construct API URL
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/zombie?userid=${targetUID}`;

  // Send initial loading message
  const loadingMsg = await api.sendMessage(
    `🧟 Generating Zombie-style image for user ID: ${targetUID}...\nPlease wait...`,
    threadID
  );

  try {
    // Fetch image from API
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 60000 });

    // Save image temporarily
    const filePath = path.join(__dirname, `zombie_${targetUID}.png`);
    await fs.writeFile(filePath, response.data);

    // Send the generated image
    await api.sendMessage(
      {
        body: `✅ Zombie-style image generated successfully!\n👤 User ID: ${targetUID}`,
        attachment: fs.createReadStream(filePath),
      },
      threadID
    );

    // Cleanup
    await fs.remove(filePath).catch(() => {});
    await api.deleteMessage(loadingMsg.messageID);
  } catch (error) {
    console.error('Error generating Zombie-style image:', error);
    await api.editMessage(
      '❌ Failed to generate Zombie-style image. Please try again later.',
      loadingMsg.messageID
    );
  }
};