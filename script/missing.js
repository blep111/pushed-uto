const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'missing',
  version: '1.1.0',
  role: 0,
  aliases: ['missingperson', 'missingpic'],
  description: 'Generate a Missing Person-style image using Betadash API',
  usage: '@mention | <userID> | <name> | <number>',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, mentions } = event;

  // Determine target user
  const targetUID = Object.keys(mentions || {})[0] || args[0];

  // Determine name and number
  const name = args[1];
  const number = args[2];

  // Check if all required inputs are provided
  if (!targetUID || !name || !number) {
    return api.sendMessage(
      `❌ Missing required input!\nPlease provide the following:\n• User mention or ID\n• Name\n• Number\n\nExample: @user John 09171234567`,
      threadID,
      messageID
    );
  }

  // Construct API URL
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/missing?userid=${targetUID}&name=${encodeURIComponent(name)}&number=${encodeURIComponent(number)}`;

  // Send initial loading message
  const loadingMsg = await api.sendMessage(
    `🕵️‍♂️ Generating Missing Person poster for user ID: ${targetUID}...\nPlease wait...`,
    threadID
  );

  try {
    // Fetch image from API
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 60000 });

    // Save image temporarily
    const filePath = path.join(__dirname, `missing_${targetUID}.png`);
    await fs.writeFile(filePath, response.data);

    // Send the generated image
    await api.sendMessage(
      {
        body: `✅ Missing Person poster generated successfully!\n👤 Name: ${name}\n📞 Number: ${number}`,
        attachment: fs.createReadStream(filePath),
      },
      threadID
    );

    // Cleanup
    await fs.remove(filePath).catch(() => {});
    await api.deleteMessage(loadingMsg.messageID);
  } catch (error) {
    console.error('Error generating Missing Person image:', error);
    await api.editMessage(
      '❌ Failed to generate Missing Person image. Please try again later.',
      loadingMsg.messageID
    );
  }
};