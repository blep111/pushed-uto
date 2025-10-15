const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');

module.exports.config = {
  name: 'gemini',
  version: '1.2.0',
  role: 0,
  aliases: ['geminiapi', 'gpt'],
  description: 'Gemini AI: answer questions via text or analyze sent images',
  usage: 'Send text or photo with this command',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, messageReply, attachments } = event;

  let loadingMsg;
  try {
    // Check if the user sent/replied with an image
    let attachmentURL = null;
    if (attachments && attachments.length > 0) attachmentURL = attachments[0].url;
    else if (messageReply && messageReply.attachments && messageReply.attachments.length > 0) attachmentURL = messageReply.attachments[0].url;

    if (!attachmentURL && args.length === 0) {
      return api.sendMessage(
        '❌ Please send text or an image for Gemini to process.',
        threadID,
        messageID
      );
    }

    // Send loading message
    loadingMsg = await api.sendMessage('🔎 Processing with Gemini AI, please wait...', threadID);

    let resultText = '';

    if (attachmentURL) {
      // If user sent image
      const imageResponse = await axios.get(attachmentURL, { responseType: 'arraybuffer' });
      const filePath = path.join(__dirname, `gemini_${Date.now()}.jpg`);
      await fs.writeFile(filePath, imageResponse.data);

      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));

      const apiResponse = await axios.post(
        'https://gemini-web-api.onrender.com/',
        formData,
        { headers: formData.getHeaders(), timeout: 60000 }
      );

      resultText = apiResponse.data?.result || 'No readable text returned from the image.';

      await fs.remove(filePath).catch(() => {});
    } else {
      // If user sent text
      const text = args.join(' ');
      const apiResponse = await axios.get(`https://gemini-web-api.onrender.com/?text=${encodeURIComponent(text)}`, { timeout: 60000 });
      resultText = apiResponse.data?.result || apiResponse.data || 'No readable text returned.';
    }

    // Send the result
    await api.sendMessage(`📄 Gemini Response:\n${resultText}`, threadID);

    // Delete loading message
    await api.deleteMessage(loadingMsg.messageID);
  } catch (error) {
    console.error('Error in Gemini AI command:', error);
    if (loadingMsg) await api.editMessage('❌ Failed to process input. Please try again later.', loadingMsg.messageID);
  }
};