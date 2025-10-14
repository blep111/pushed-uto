const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'ss',
  version: '1.0.0',
  role: 0,
  aliases: ['screenshot', 'shot'],
  description: 'Take a screenshot of a website URL using Betadash screenshot API',
  usage: '<reply to a message with URL> OR <imgshot https://example.com>',
  credits: 'Vern',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, messageReply } = event;

  // Try to get URL from args first, otherwise from replied message body
  let targetUrl = (args && args.length) ? args.join(' ').trim() : null;

  if (!targetUrl && messageReply && messageReply.body) {
    // messageReply.body may contain the URL (or text that includes it)
    targetUrl = messageReply.body.trim();
  }

  // Basic validation (starts with http)
  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
    return api.sendMessage(
      '❌ Please provide a valid URL. Use `imgshot https://example.com` or reply to a message that contains the URL.',
      threadID,
      messageID
    );
  }

  const encoded = encodeURIComponent(targetUrl);
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/screenshot?url=${encoded}`;

  // Send initial "working" message and then perform request
  api.sendMessage('🌐 Creating screenshot, please wait...', threadID, async (err, info) => {
    if (err) {
      console.error('Failed to send initial message:', err);
      return;
    }

    try {
      // First try: assume JSON response (some APIs return { link: '...' })
      let resp;
      try {
        resp = await axios.get(apiUrl, { timeout: 30000, responseType: 'json' });
      } catch (firstErr) {
        // If JSON parse failed or server returned binary, we'll handle below
        resp = null;
      }

      if (resp && resp.data) {
        // If API returns a link/url in JSON, send it
        const data = resp.data;
        const possibleLink = data.link || data.url || data.result || data.image;
        if (typeof possibleLink === 'string' && /^https?:\/\//i.test(possibleLink)) {
          return api.editMessage(
            `✅ Screenshot ready:\n${possibleLink}`,
            info.messageID
          );
        }
        // Otherwise proceed to try downloading binary image below
      }

      // Fallback: request as binary (image bytes)
      const imgResp = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 45000 });
      const contentType = (imgResp.headers && imgResp.headers['content-type']) || '';

      // Validate that response looks like an image
      if (!contentType.startsWith('image/') && !(imgResp.data && imgResp.data.length > 0)) {
        console.error('Unexpected API response:', {
          headers: imgResp.headers,
          length: imgResp.data ? imgResp.data.length : 0,
        });
        return api.editMessage('❌ Failed to get screenshot image from the API.', info.messageID);
      }

      // Save to temporary file
      const tmpName = `screenshot_${Date.now()}.png`;
      const tmpPath = path.join(__dirname, tmpName);
      await fs.writeFile(tmpPath, Buffer.from(imgResp.data), 'binary');

      // Send image as attachment
      await api.sendMessage(
        { body: '✅ Screenshot ready:', attachment: fs.createReadStream(tmpPath) },
        threadID,
        (sendErr) => {
          // cleanup file regardless of send result
          fs.remove(tmpPath).catch((e) => console.warn('Failed to remove tmp file', e));
          if (sendErr) {
            console.error('Failed to send screenshot file:', sendErr);
            // edit previous message to indicate failure
            return api.editMessage('❌ Failed to send the screenshot file.', info.messageID);
          } else {
            // remove the "working" message
            return api.deleteMessage(info.messageID);
          }
        }
      );
    } catch (error) {
      console.error('Error while creating screenshot:', error);
      try {
        await api.editMessage('❌ An error occurred while taking the screenshot. Try again later.', info.messageID);
      } catch (e) {
        // ignore
      }
    }
  });
};