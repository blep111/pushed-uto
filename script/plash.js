const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'unsplash',
  version: '1.0.0',
  role: 0,
  aliases: ['photo', 'image'],
  description: 'Fetch random or searched photos from Unsplash API',
  usage: '<keyword> [count]',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  // Extract search term and optional count
  let searchTerm = args[0];
  let count = 5; // default number of photos

  if (!searchTerm) {
    return api.sendMessage(
      '❌ Please provide a search keyword.\nExample: unsplash cat 5',
      threadID,
      messageID
    );
  }

  if (args[1] && !isNaN(args[1])) count = Math.min(parseInt(args[1]), 10);

  const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/unsplash?search=${encodeURIComponent(
    searchTerm
  )}&count=${count}`;

  api.sendMessage(
    `📸 Searching Unsplash for "${searchTerm}" (${count} photos)...`,
    threadID,
    async (err, info) => {
      if (err) return;

      try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!Array.isArray(data) || data.length === 0) {
          return api.editMessage(
            `❌ No results found for "${searchTerm}".`,
            info.messageID
          );
        }

        // Download all image files temporarily
        const imagePaths = [];
        for (let i = 0; i < data.length; i++) {
          const imgUrl =
            data[i].url ||
            data[i].image ||
            data[i].photo ||
            data[i].src ||
            null;

          if (!imgUrl) continue;

          const imgResp = await axios.get(imgUrl, { responseType: 'arraybuffer' });
          const imgPath = path.join(__dirname, `unsplash_${Date.now()}_${i}.jpg`);
          await fs.writeFile(imgPath, imgResp.data);
          imagePaths.push(imgPath);
        }

        if (imagePaths.length === 0) {
          return api.editMessage(
            `❌ Failed to download images from Unsplash.`,
            info.messageID
          );
        }

        // Send all images together
        const attachments = imagePaths.map((p) => fs.createReadStream(p));
        api.sendMessage(
          {
            body: `✅ Results for "${searchTerm}" — showing ${imagePaths.length} photos.`,
            attachment: attachments,
          },
          threadID,
          async () => {
            // Cleanup temporary files after sending
            for (const p of imagePaths) {
              await fs.remove(p).catch(() => {});
            }

            // Delete the loading message
            api.deleteMessage(info.messageID);
          }
        );
      } catch (error) {
        console.error('Error fetching Unsplash images:', error);
        api.editMessage(
          '❌ An error occurred while fetching images. Please try again later.',
          info.messageID
        );
      }
    }
  );
};