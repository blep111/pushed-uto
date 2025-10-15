const axios = require('axios');

module.exports.config = {
  name: 'gemini',
  version: '1.0.2',
  role: 0,
  aliases: ['askgemini'],
  description: 'Ask Gemini AI a question or analyze an image',
  usage: '<text question> or send/reply to an image',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, messageReply, attachments, senderID } = event;

  // Determine input type
  let askText = args.join(' ').trim();
  let imageUrl = null;

  if (attachments && attachments.length > 0) imageUrl = attachments[0].url;
  else if (messageReply && messageReply.attachments && messageReply.attachments.length > 0)
    imageUrl = messageReply.attachments[0].url;

  if (!askText && !imageUrl) {
    return api.sendMessage(
      '❌ Please send a question or an image for Gemini to process.',
      threadID,
      messageID
    );
  }

  const loadingMsg = await api.sendMessage('🔎 Processing with Gemini AI, please wait...', threadID);

  try {
    const apiUrl = `https://gemini-web-api.onrender.com/gemini?ask=${encodeURIComponent(
      askText || ''
    )}&uid=${senderID}&image_url=${encodeURIComponent(imageUrl || '')}`;

    const response = await axios.get(apiUrl, { timeout: 60000 });

    // Extract the readable response
    let resultText = '';
    if (response.data) {
      // Prefer .response or .result or .text fields
      resultText =
        response.data.response ||
        response.data.result ||
        response.data.text ||
        (typeof response.data === 'string' ? response.data : null);

      if (!resultText) {
        // Fallback: flatten object to readable string
        resultText = Object.entries(response.data)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n');
      }
    } else {
      resultText = 'No response returned from Gemini.';
    }

    await api.sendMessage(`📄 Gemini says:\n${resultText}`, threadID, messageID);
    await api.deleteMessage(loadingMsg.messageID);
  } catch (error) {
    console.error('Error with Gemini API:', error);
    await api.editMessage(
      '❌ Failed to process your request. Please try again later.',
      loadingMsg.messageID
    );
  }
};