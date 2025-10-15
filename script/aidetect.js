const axios = require('axios');

module.exports.config = {
  name: 'aidetect',
  version: '1.0.0',
  role: 0,
  aliases: ['checkai', 'aicheck'],
  description: 'Detect if a text is AI-generated using Betadash AI Detect API',
  usage: '<text>',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // Join all arguments as the text to detect
  const text = args.join(' ');
  if (!text) {
    return api.sendMessage('❌ Please provide some text to detect.', threadID, messageID);
  }

  // Construct API URL
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/aidetect?text=${encodeURIComponent(text)}`;

  // Send initial loading message
  const loadingMsg = await api.sendMessage(
    `🤖 Detecting if the following text is AI-generated:\n"${text}"\nPlease wait...`,
    threadID
  );

  try {
    // Fetch detection result
    const response = await axios.get(apiUrl, { timeout: 60000 });
    const result = response.data;

    // Send result
    await api.sendMessage(
      `✅ AI Detection Result:\n\nText: "${text}"\n\nResult: ${result.result || JSON.stringify(result)}`,
      threadID
    );

    // Delete loading message
    await api.deleteMessage(loadingMsg.messageID);
  } catch (error) {
    console.error('Error detecting AI text:', error);
    await api.editMessage(
      '❌ Failed to detect AI content. Please try again later.',
      loadingMsg.messageID
    );
  }
};