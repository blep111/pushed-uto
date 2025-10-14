const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'activist',
  version: '1.0.0',
  role: 0,
  aliases: ['activists', 'poster'],
  description: 'Generate an activist-themed image for the mentioned user or UID using Betadash API',
  usage: '@mention | <uid> | <uid> <text> | @mention <text>',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, mentions, senderID } = event;

  // Determine target user ID
  let targetUID;
  let textPrompt;

  if (Object.keys(mentions).length > 0) {
    targetUID = Object.keys(mentions)[0];
    textPrompt = args.slice(1).join(' ') || 'Freedom for All';
  } else if (args.length > 0 && /^\d+$/.test(args[0])) {
    targetUID = args[0];
    textPrompt = args.slice(1).join(' ') || 'Freedom for All';
  } else {
    targetUID = senderID;
    textPrompt = args.join(' ') || 'Freedom for All';
  }

  // Construct the API URL
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/activists?userid=${targetUID}&text=${encodeURIComponent(textPrompt)}`;

  // Send loading message
  api.sendMessage(
    `✊ Generating Activist Poster for UID: ${targetUID}\n📝 Text: "${textPrompt}"\n⏳ Please wait...`,
    threadID,
    async (err, info) => {
      if (err) return;

      try {
        // Fetch image from API
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 60000 });

        // Save image temporarily
        const filePath = path.join(__dirname, `activist_${targetUID}.png`);
        await fs.writeFile(filePath, Buffer.from(response.data));

        // Send generated image
        await api.sendMessage(
          {
            body: `✅ Activist Poster generated successfully!\n👤 User ID: ${targetUID}\n🗣️ Message: "${textPrompt}"`,
            attachment: fs.createReadStream(filePath),
          },
          threadID,
          async () => {
            await fs.remove(filePath).catch(() => {});
            api.deleteMessage(info.messageID);
          },
          messageID
        );
      } catch (error) {
        console.error('Error generating activist poster:', error);
        api.editMessage(
          '❌ Failed to generate the Activist Poster. Please try again later.',
          info.messageID
        );
      }
    }
  );
};