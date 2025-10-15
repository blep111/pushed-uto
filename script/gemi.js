const axios = require('axios');

module.exports.config = {
  name: 'gemini',
  version: '1.0.1',
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
  else if (messageReply && messageReply.attachments && messageReply.attachments.length > 0) imageUrl = messageReply.attachments[0].url;

  if (!askText && !imageUrl) {
    return api.sendMessage(
      '❌ Please send a question or an image for Gemini to process.',
      threadID,
      messageID
    );
  }

  // Send loading message
  const loadingMsg = await api.sendMessage('🔎 Processing with Gemini AI, please wait...', threadID);

  try {
    // Construct API URL
    const apiUrl = `https://gemini-web-api.onrender.com/gemini?ask=${encodeURIComponent(askText || '')}&uid=${senderID}&image_url=${encodeURIComponent(imageUrl || '')}`;

    // Fetch response from API
    const response = await axios.get(apiUrl, { timeout: 60000 });

    // Extract readable response
    let resultText = '';
    if (response.data) {
      if (typeof response.data === 'string') resultText = response.data;
      else if (response.data.result) resultText = response.data.result;
      else if (response.data.text) resultText = response.data.text;
      else resultText = JSON.stringify(response.data, null, 2);
    } else {
      resultText = 'No readable response returned from Gemini.';
    }

    // Send readable result
    await api.sendMessage(`📄 Gemini Response:\n${resultText}`, threadID, messageID);

    // Delete loading message
    await api.deleteMessage(loadingMsg.messageID);
  } catch (error) {
    console.error('Error with Gemini API:', error);
    await api.editMessage('❌ Failed to process your request. Please try again later.', loadingMsg.messageID);
  }
};