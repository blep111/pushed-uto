const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'breakingnews',
  version: '1.1.0',
  role: 0,
  aliases: ['bnews', 'news'],
  description: 'Generate a Breaking News-style image for any user ID with custom text using Betadash API',
  usage: '@mention | <userID> | <channel> | <title> | <headline>',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, mentions, senderID } = event;

  // Determine target user:
  // 1. Mentioned user
  // 2. User ID provided as first argument
  // 3. Fallback to sender
  const targetUID = Object.keys(mentions || {})[0] || args[0] || senderID;

  // Extract arguments: channel, title, headline
  // If args[0] is a userID, slice it out
  const argStartIndex = Object.keys(mentions || {})[0] || (!isNaN(args[0]) ? 1 : 0);
  const [channel = 'DYZZ', title = 'Breaking Update', headline = 'No headline provided'] = args.slice(argStartIndex);

  // Construct API URL
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/breaking-news?userid=${targetUID}&channel=${encodeURIComponent(channel)}&title=${encodeURIComponent(title)}&headline=${encodeURIComponent(headline)}`;

  // Send initial loading message
  const loadingMsg = await api.sendMessage(
    `📰 Generating Breaking News poster for user ID: ${targetUID}...\n🕓 Please wait...`,
    threadID
  );

  try {
    // Fetch image from API (binary data)
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 60000 });

    // Save image temporarily
    const filePath = path.join(__dirname, `breakingnews_${targetUID}.png`);
    await fs.writeFile(filePath, response.data);

    // Send the generated image
    await api.sendMessage(
      {
        body: `✅ Breaking News poster generated successfully!\n📺 Channel: ${channel.toUpperCase()}\n🗞️ Title: ${title}\n📰 Headline: ${headline}`,
        attachment: fs.createReadStream(filePath),
      },
      threadID
    );

    // Cleanup
    await fs.remove(filePath).catch(() => {});
    await api.deleteMessage(loadingMsg.messageID);
  } catch (error) {
    console.error('Error generating Breaking News image:', error);
    await api.editMessage(
      '❌ Failed to generate Breaking News image. Please try again later.',
      loadingMsg.messageID
    );
  }
};