const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'blink',
  version: '1.0.2',
  role: 0,
  aliases: ['blinkpic'],
  description: 'Generate a Blink-style image of a user using Betadash API',
  usage: '@mention | <userID>',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, mentions } = event;

  // Try to get target from mention or from args (if user typed: blink 6158...)
  let targetUID = Object.keys(mentions || {})[0] || (args && args[0]) || null;

  // If args[0] exists but is a mention (some frameworks) we'd already have mentions.
  // Validate numeric user id (simple check) — allow digits and plus sign
  const isValidUID = uid => typeof uid === 'string' && /^[0-9+]+$/.test(uid);

  if (targetUID && !isValidUID(targetUID)) {
    // maybe user typed a username or something; prefer to check if args[0] contains digits
    if (args && args[0]) {
      const maybe = args[0].trim();
      if (isValidUID(maybe)) targetUID = maybe;
      else targetUID = null;
    } else {
      targetUID = null;
    }
  }

  if (!targetUID) {
    // Ask the user for input, then listen for a reply (mention or raw UID)
    const prompt = await api.sendMessage(
      '✨ Please reply to this message with the **user ID** (numbers) or **mention** the user you want to generate the Blink image for.\n\nExample replies:\n• `61581526372855`\n• `@someone`',
      threadID,
      (err, info) => {}
    );

    // Handler for incoming messages in the same thread
    const handleReply = async (replyEvent) => {
      try {
        if (replyEvent.threadID !== threadID) return; // ignore other threads
        // If the user replied to our prompt message specifically, or simply sent a message in thread, accept it
        // Prefer mention in reply
        const replyMentions = replyEvent.mentions || {};
        let candidate = Object.keys(replyMentions)[0]; // first mention's id

        // If no mention, check reply body for digits
        const body = (replyEvent.body || '').trim();

        if (!candidate && body) {
          // if body is numeric (uid), accept it
          const maybe = body.split(/\s+/)[0]; // take first token
          if (/^[0-9+]+$/.test(maybe)) candidate = maybe;
        }

        if (!candidate) {
          // Not a valid input
          await api.sendMessage('❌ Invalid input. Please reply with a numeric user ID or mention a user.', threadID);
          return;
        }

        // Remove listener and optionally delete the prompt
        api.removeListener('message', handleReply);
        try { await api.deleteMessage(prompt.messageID); } catch (e) {}

        // Proceed to generate image
        await generateBlinkImage(api, threadID, candidate, messageID);
      } catch (err) {
        console.error('Reply handler error:', err);
      }
    };

    // Add listener
    api.on('message', handleReply);

    // Auto-timeout: remove listener after 60 seconds to avoid memory leaks
    setTimeout(async () => {
      try {
        api.removeListener('message', handleReply);
        // If prompt still exists, optionally edit or remind user
        await api.sendMessage('⌛ Request timed out. Run the command again and provide the user ID or mention.', threadID);
      } catch (e) {}
    }, 60 * 1000);

    return;
  }

  // If we have a valid targetUID already, generate immediately
  return await generateBlinkImage(api, threadID, targetUID, messageID);
};

// Function to generate Blink image
async function generateBlinkImage(api, threadID, targetUID, replyMessageID) {
  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/blink?userid=${encodeURIComponent(targetUID)}`;

  const loadingMsg = await api.sendMessage(`✨ Generating Blink image for user ID: ${targetUID}...\nPlease wait...`, threadID);

  try {
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 60000 });

    // Save image temporarily
    const filePath = path.join(__dirname, `blink_${targetUID}_${Date.now()}.png`);
    await fs.writeFile(filePath, response.data);

    // Send image
    await api.sendMessage(
      {
        body: `✅ Blink image generated successfully!\n👤 User ID: ${targetUID}`,
        attachment: fs.createReadStream(filePath),
      },
      threadID,
      async () => {
        // Cleanup
        await fs.remove(filePath).catch(() => {});
        try { await api.deleteMessage(loadingMsg.messageID); } catch (e) {}
      },
      replyMessageID
    );
  } catch (error) {
    console.error('Error generating Blink image:', error);
    try {
      await api.editMessage('❌ Failed to generate Blink image. Please try again later.', loadingMsg.messageID);
    } catch (e) {
      await api.sendMessage('❌ Failed to generate Blink image. Please try again later.', threadID);
    }
  }
}