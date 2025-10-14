const axios = require('axios');
const fs = require('fs-extra');

module.exports.config = {
  name: 'cinema',
  version: '1.0.0',
  role: 0,
  aliases: ['moviecanvas'],
  description: 'Generate a Cinema-style image for the given user ID',
  usage: '<userid>',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const userID = args[0];

  if (!userID) {
    return api.sendMessage(
      '🎬 Please provide a Facebook user ID.\n\nExample:\ncinema 61581526372855',
      threadID,
      messageID
    );
  }

  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/cinema?userid=${encodeURIComponent(userID)}`;

  api.sendMessage('🎞️ Generating Cinema Canvas... please wait.', threadID, async (err, info) => {
    if (err) return;

    try {
      const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
      const imgPath = __dirname + `/cache/cinema_${userID}.jpg`;
      await fs.outputFile(imgPath, response.data);

      api.sendMessage(
        {
          body: `🍿 Cinema Canvas generated successfully!\n🎬 User ID: ${userID}`,
          attachment: fs.createReadStream(imgPath),
        },
        threadID,
        () => fs.unlinkSync(imgPath),
        messageID
      );
    } catch (error) {
      console.error('❌ Error fetching cinema image:', error);
      api.editMessage(
        '❌ Failed to generate Cinema Canvas. Please try again later.',
        info.messageID
      );
    }
  });
};