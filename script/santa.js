const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'santa',
  version: '1.0.0',
  role: 0,
  aliases: ['parcel', 'santa'],
  description: 'Generate a Santa’s Parcel-style image with custom text for any user using Betadash API',
  usage: '@mention | <userID> | <text>',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, mentions, senderID } = event;

  // Determine target user
  const targetUID = Object.keys(mentions || {})[0] || args[0] || senderID;

  // Determine custom text
  // If first arg is a userID or mention, slice it out
  const argStartIndex = (Object.keys(mentions || {})[0] || (!isNaN(args[0]) && args[0])) ? 1 : 0;
  const text = args.slice(argStartIndex).join(' ') || 'Merry Christmas!';

  // Construct API URL
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/santas-parcel?userid=${targetUID}&text=${encodeURIComponent(text)}`;

  // Send initial loading message
  const loadingMsg = await api.sendMessage(
    `🎁 Generating Santa’s Parcel for user ID: ${targetUID}...\nPlease wait...`,
    threadID
  );

  try {
    // Fetch image from API
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 60000 });

    // Save image temporarily
    const filePath = path.join(__dirname, `santasparcel_${targetUID}.png`);
    await fs.writeFile(filePath, response.data);

    // Send the generated image
    await api.sendMessage(
      {
        body: `✅ Santa’s Parcel generated successfully!\n📜 Message: ${text}`,
        attachment: fs.createReadStream(filePath),
      },
      threadID
    );

    // Cleanup
    await fs.remove(filePath).catch(() => {});
    await api.deleteMessage(loadingMsg.messageID);
  } catch (error) {
    console.error('Error generating Santa’s Parcel image:', error);
    await api.editMessage(
      '❌ Failed to generate Santa’s Parcel image. Please try again later.',
      loadingMsg.messageID
    );
  }
};