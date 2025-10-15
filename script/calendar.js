const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'calendar',
  version: '1.0.2',
  role: 0,
  aliases: ['calendarpic'],
  description: 'Generate a Calendar-style image of a user using Betadash API',
  usage: '@mention | <userID>',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, mentions } = event;

  // Extract target user
  let targetUID = Object.keys(mentions || {})[0] || (args && args[0]) || null;

  // UID validation helper
  const isValidUID = (uid) => typeof uid === 'string' && /^[0-9+]+$/.test(uid);

  if (targetUID && !isValidUID(targetUID)) {
    const maybe = args && args[0] ? args[0].trim() : '';
    targetUID = isValidUID(maybe) ? maybe : null;
  }

  if (!targetUID) {
    // Ask for UID or mention
    const prompt = await api.sendMessage(
      '📅 Please reply to this message with the **user ID** (numbers) or **mention** the user to generate the Calendar image.\n\nExample replies:\n• `61581526372855`\n• `@someone`',
      threadID
    );

    const handleReply = async (replyEvent) => {
      try {
        if (replyEvent.threadID !== threadID) return;

        const replyMentions = replyEvent.mentions || {};
        let candidate = Object.keys(replyMentions)[0];
        const body = (replyEvent.body || '').trim();

        if (!candidate && body) {
          const maybe = body.split(/\s+/)[0];
          if (/^[0-9+]+$/.test(maybe)) candidate = maybe;
        }

        if (!candidate) {
          await api.sendMessage('❌ Invalid input. Please reply with a valid user ID or mention.', threadID);
          return;
        }

        api.removeListener('message', handleReply);
        try { await api.deleteMessage(prompt.messageID); } catch (e) {}

        await generateCalendarImage(api, threadID, candidate, messageID);
      } catch (err) {
        console.error('Reply handler error (calendar):', err);
      }
    };

    api.on('message', handleReply);

    // Remove listener after 60s
    setTimeout(async () => {
      try {
        api.removeListener('message', handleReply);
        await api.sendMessage('⌛ Request timed out. Please run the command again and provide a user ID or mention.', threadID);
      } catch (e) {}
    }, 60 * 1000);

    return;
  }

  // If UID is already available
  return await generateCalendarImage(api, threadID, targetUID, messageID);
};

// Function to generate Calendar image
async function generateCalendarImage(api, threadID, targetUID, replyMessageID) {
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/calendar?userid=${encodeURIComponent(targetUID)}`;

  const loadingMsg = await api.sendMessage(`📆 Generating Calendar image for user ID: ${targetUID}...\nPlease wait...`, threadID);

  try {
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 60000 });
    const filePath = path.join(__dirname, `calendar_${targetUID}_${Date.now()}.png`);
    await fs.writeFile(filePath, response.data);

    await api.sendMessage(
      {
        body: `✅ Calendar image generated successfully!\n👤 User ID: ${targetUID}`,
        attachment: fs.createReadStream(filePath),
      },
      threadID,
      async () => {
        await fs.remove(filePath).catch(() => {});
        try { await api.deleteMessage(loadingMsg.messageID); } catch (e) {}
      },
      replyMessageID
    );
  } catch (error) {
    console.error('Error generating Calendar image:', error);
    try {
      await api.editMessage('❌ Failed to generate Calendar image. Please try again later.', loadingMsg.messageID);
    } catch {
      await api.sendMessage('❌ Failed to generate Calendar image. Please try again later.', threadID);
    }
  }
}