const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'thief',
  version: '1.0.0',
  role: 0,
  aliases: ['wanted', 'poster'],
  description: 'Generate a Wanted Poster-style image with custom name and reward using Betadash API',
  usage: '@mention | <userID> | <name> | <reward>',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, mentions, senderID } = event;

  // Determine target user
  const targetUID = Object.keys(mentions || {})[0] || args[0] || senderID;

  // Extract name and reward from arguments
  // If first arg is a userID or mention, slice it out
  const argStartIndex = (Object.keys(mentions || {})[0] || (!isNaN(args[0]) && args[0])) ? 1 : 0;
  const [name = 'Unknown', reward = 'No reward'] = args.slice(argStartIndex);

  // Construct API URL
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/wanted-poster?userid=${targetUID}&name=${encodeURIComponent(name)}&reward=${encodeURIComponent(reward)}`;

  // Send initial loading message
  const loadingMsg = await api.sendMessage(
    `🚨 Generating Wanted Poster for user ID: ${targetUID}...\nPlease wait...`,
    threadID
  );

  try {
    // Fetch image from API
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 60000 });

    // Save image temporarily
    const filePath = path.join(__dirname, `wantedposter_${targetUID}.png`);
    await fs.writeFile(filePath, response.data);

    // Send the generated image
    await api.sendMessage(
      {
        body: `✅ Wanted Poster generated successfully!\n👤 Name: ${name}\n💰 Reward: ${reward}`,
        attachment: fs.createReadStream(filePath),
      },
      threadID
    );

    // Cleanup
    await fs.remove(filePath).catch(() => {});
    await api.deleteMessage(loadingMsg.messageID);
  } catch (error) {
    console.error('Error generating Wanted Poster image:', error);
    await api.editMessage(
      '❌ Failed to generate Wanted Poster image. Please try again later.',
      loadingMsg.messageID
    );
  }
};