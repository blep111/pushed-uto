const axios = require('axios');

module.exports.config = {
  name: 'aidetect',
  version: '1.1.0',
  role: 0,
  aliases: ['checkai', 'aicheck'],
  description: 'Detect if a text is AI-generated using Betadash AI Detect API',
  usage: '<text>',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  // Join all arguments as the text to detect
  const text = args.join(' ');
  if (!text) {
    return api.sendMessage('❌ Please provide some text to detect.', threadID, messageID);
  }

  // Construct API URL
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/aidetect?text=${encodeURIComponent(text)}`;

  // Send initial loading message
  const loadingMsg = await api.sendMessage(
    `🤖 Detecting AI content...`,
    threadID
  );

  try {
    // Fetch detection result
    const response = await axios.get(apiUrl, { timeout: 60000 });
    const data = response.data?.data;

    // Extract the human-readable feedback
    const feedback = data?.feedback || 'No result found';

    // Send clean result
    await api.sendMessage(
      `📝 Detection Result: ${feedback}`,
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