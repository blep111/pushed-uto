const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'breakingnews',
  version: '1.2.0',
  role: 0,
  aliases: ['bnews', 'news'],
  description: 'Generate a Breaking News-style image for any user ID with custom text using Betadash API',
  usage: '@mention | <userID> | <channel> | <title> | <headline>',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, mentions, senderID } = event;

  let targetUID = Object.keys(mentions || {})[0] || args[0] || null;
  let channel = args[1] || null;
  let title = args[2] || null;
  let headline = args[3] || null;

  // Helper function to prompt user for missing inputs
  async function promptUser(promptText, callback) {
    const loadingMsg = await api.sendMessage(promptText, threadID);

    const handleReply = async (replyEvent) => {
      if (replyEvent.threadID !== threadID) return;
      const input = replyEvent.messageReply?.body || replyEvent.args?.[0];

      if (!input) return api.sendMessage('❌ Invalid input. Please try again.', threadID);

      api.removeListener('message', handleReply);
      await api.deleteMessage(loadingMsg.messageID);
      callback(input);
    };

    api.on('message', handleReply);
  }

  // Step 1: Get userID if missing
  if (!targetUID) {
    return promptUser('📰 Please provide the user ID or mention the user for the Breaking News poster.', (input) => {
      targetUID = input;
      module.exports.run({ api, event, args: [] }); // Restart with filled data
    });
  }

  // Step 2: Get channel if missing
  if (!channel) {
    return promptUser('📺 Please enter the news channel name:', (input) => {
      channel = input;
      module.exports.run({ api, event, args: [] });
    });
  }

  // Step 3: Get title if missing
  if (!title) {
    return promptUser('🗞️ Please enter the title of the news:', (input) => {
      title = input;
      module.exports.run({ api, event, args: [] });
    });
  }

  // Step 4: Get headline if missing
  if (!headline) {
    return promptUser('📰 Please enter the headline text:', (input) => {
      headline = input;
      module.exports.run({ api, event, args: [] });
    });
  }

  // All inputs gathered, generate image
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/breaking-news?userid=${targetUID}&channel=${encodeURIComponent(channel)}&title=${encodeURIComponent(title)}&headline=${encodeURIComponent(headline)}`;

  const loadingMsg = await api.sendMessage(`📰 Generating Breaking News poster for user ID: ${targetUID}...\n🕓 Please wait...`, threadID);

  try {
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 60000 });
    const filePath = path.join(__dirname, `breakingnews_${targetUID}.png`);
    await fs.writeFile(filePath, response.data);

    await api.sendMessage(
      {
        body: `✅ Breaking News poster generated successfully!\n📺 Channel: ${channel}\n🗞️ Title: ${title}\n📰 Headline: ${headline}`,
        attachment: fs.createReadStream(filePath),
      },
      threadID,
      async () => {
        await fs.remove(filePath).catch(() => {});
        await api.deleteMessage(loadingMsg.messageID);
      }
    );
  } catch (error) {
    console.error('Error generating Breaking News image:', error);
    await api.editMessage('❌ Failed to generate Breaking News image. Please try again later.', loadingMsg.messageID);
  }
};