const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'breakingnews',
  version: '1.0.0',
  role: 0,
  aliases: ['bnews', 'news'],
  description: 'Generate a Breaking News-style image for the mentioned user using Betadash API',
  usage: '@mention | <channel> | <title> | <headline>',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, mentions, senderID } = event;

  // Mentioned user or fallback to sender
  const targetUID = Object.keys(mentions)[0] || senderID;

  // Extract arguments: channel, title, headline
  const [channel = 'DYZZ', title = 'Breaking Update', headline = 'No headline provided'] = args;

  // Construct API URL
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/breaking-news?userid=${targetUID}&channel=${encodeURIComponent(channel)}&title=${encodeURIComponent(title)}&headline=${encodeURIComponent(headline)}`;

  // Send initial loading message
  api.sendMessage(
    `📰 Generating Breaking News poster for user ID: ${targetUID}...\n🕓 Please wait...`,
    threadID,
    async (err, info) => {
      if (err) return;

      try {
        // Fetch image from API (binary data)
        const response = await axios.get(apiUrl, {
          responseType: 'arraybuffer',
          timeout: 60000,
        });

        // Save image temporarily
        const filePath = path.join(__dirname, `breakingnews_${targetUID}.png`);
        await fs.writeFile(filePath, Buffer.from(response.data), 'binary');

        // Send the generated image
        await api.sendMessage(
          {
            body: `✅ Breaking News poster generated successfully!\n📺 Channel: ${channel.toUpperCase()}\n🗞️ Title: ${title}\n📰 Headline: ${headline}`,
            attachment: fs.createReadStream(filePath),
          },
          threadID,
          async () => {
            // Cleanup
            await fs.remove(filePath).catch(() => {});
            api.deleteMessage(info.messageID);
          },
          messageID
        );
      } catch (error) {
        console.error('Error generating Breaking News image:', error);
        api.editMessage(
          '❌ Failed to generate Breaking News image. Please try again later.',
          info.messageID
        );
      }
    }
  );
};