const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

module.exports.config = {
    name: "shoti",
    version: "1.0.0",
    role: 0,
    description: "Fetch a random Shoti video.",
    prefix: false,
    premium: false,
    credits: "Vern",
    cooldowns: 10,
    category: "media"
};

module.exports.run = async function ({ api, event }) {
    try {
        api.sendMessage("🎬 Fetching a random Shoti video, please wait...", event.threadID, event.messageID);

        // API call without unnecessary headers
        const response = await axios.get('https://kaiz-apis.gleeze.com/api/shoti?apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5');
        
        const videoUrl = response.data?.result?.video;
        if (!videoUrl) {
            return api.sendMessage('❌ Failed to fetch a Shoti video. Please try again later.', event.threadID, event.messageID);
        }

        const fileName = `${event.messageID}.mp4`;
        const filePath = path.join(__dirname, fileName);

        const downloadResponse = await axios({
            method: 'GET',
            url: videoUrl,
            responseType: 'stream',
        });

        const writer = fs.createWriteStream(filePath);
        downloadResponse.data.pipe(writer);

        writer.on('finish', async () => {
            api.sendMessage({
                body: '🎥 Here’s your random Shoti video!',
                attachment: fs.createReadStream(filePath)
            }, event.threadID, () => {
                fs.unlinkSync(filePath);
            }, event.messageID);
        });

        writer.on('error', () => {
            api.sendMessage('🚫 Error downloading the video. Please try again.', event.threadID, event.messageID);
        });

    } catch (error) {
        console.error('Error fetching Shoti video:', error?.response?.data || error.message);
        api.sendMessage('🚫 Error fetching Shoti video. Try again later.', event.threadID, event.messageID);
    }
};