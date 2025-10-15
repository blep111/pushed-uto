const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'fight',
  version: '1.0.0',
  role: 0,
  aliases: ['couple', 'friendship'],
  description: 'Generate a WWW-style image for two users using Betadash API',
  usage: '@mention1 | @mention2 | <userid1> <userid2>',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, mentions, senderID } = event;

  // Determine first user ID
  const user1 = Object.keys(mentions || {})[0] || args[0] || senderID;

  // Determine second user ID
  let mentionArray = Object.keys(mentions || {});
  let user2;
  if (mentionArray.length > 1) {
    user2 = mentionArray[1];
  } else if (args[1]) {
    user2 = args[1];
  } else {
    user2 = senderID; // fallback to sender if no second user
  }

  // Construct API URL
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/www?userid1=${user1}&userid2=${user2}`;

  // Send initial loading message
  const loadingMsg = await api.sendMessage(
    `💖 Generating WWW poster for user IDs: ${user1} & ${user2}...\nPlease wait...`,
    threadID
  );

  try {
    // Fetch image from API
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 60000 });

    // Save image temporarily
    const filePath = path.join(__dirname, `www_${user1}_${user2}.png`);
    await fs.writeFile(filePath, response.data);

    // Send the generated image
    await api.sendMessage(
      {
        body: `✅ WWW poster generated successfully!\n👤 User1: ${user1}\n👤 User2: ${user2}`,
        attachment: fs.createReadStream(filePath),
      },
      threadID
    );

    // Cleanup
    await fs.remove(filePath).catch(() => {});
    await api.deleteMessage(loadingMsg.messageID);
  } catch (error) {
    console.error('Error generating WWW image:', error);
    await api.editMessage(
      '❌ Failed to generate WWW image. Please try again later.',
      loadingMsg.messageID
    );
  }
};