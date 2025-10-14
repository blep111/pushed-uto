const axios = require('axios');
const fs = require('fs-extra');

module.exports.config = {
  name: 'bracelet',
  version: '1.0.0',
  role: 0,
  aliases: ['brace'],
  description: 'Generate a bracelet-style image from your text prompt',
  usage: '<text>',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const text = args.join(' ');

  if (!text) {
    return api.sendMessage(
      '💫 Please provide a text to generate your bracelet.\n\nExample:\nbracelet Vern',
      threadID,
      messageID
    );
  }

  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/bracelet?text=${encodeURIComponent(text)}`;

  api.sendMessage('🔮 Crafting your bracelet... please wait.', threadID, async (err, info) => {
    if (err) return;

    try {
      const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
      const imgPath = __dirname + `/cache/bracelet_${Date.now()}.jpg`;
      await fs.outputFile(imgPath, response.data);

      api.sendMessage(
        {
          body: `✨ Bracelet generated successfully!\n💬 Text: ${text}`,
          attachment: fs.createReadStream(imgPath),
        },
        threadID,
        () => fs.unlinkSync(imgPath),
        messageID
      );
    } catch (error) {
      console.error('❌ Error fetching bracelet image:', error);
      api.editMessage(
        '❌ Failed to generate bracelet image. Please try again later.',
        info.messageID
      );
    }
  });
};