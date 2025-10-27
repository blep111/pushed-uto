const axios = require("axios");
const path = require("path");
const fs = require("fs-extra");

module.exports.config = {
    name: "spotify",
    version: "1.0.0",
    role: 0,
    description: "Fetch a Spotify song with its audio and cover.",
    prefix: false,
    premium: false,
    credits: "Gab",
    cooldowns: 3,
    category: "media"
};

module.exports.run = async function ({ api, event, args }) {
    try {
        // Get song name from user input
        const songName = args.join(" ");
        if (!songName) {
            return api.sendMessage("🎶 Please enter a song name.\nExample: spotify multo cup of joe", event.threadID, event.messageID);
        }

        // Notify user
        api.sendMessage(`🎧 Searching for “${songName}” on Spotify, please wait...`, event.threadID, event.messageID);

        // API request
        const response = await axios.get(`https://api-library-kohi.onrender.com/api/spotify?song=${encodeURIComponent(songName)}`);
        const data = response.data?.data;

        if (!data || !data.audioUrl) {
            return api.sendMessage("❌ Song not found or failed to fetch audio.", event.threadID, event.messageID);
        }

        const fileName = `${event.messageID}.mp3`;
        const filePath = path.join(__dirname, fileName);

        // Download audio
        const audioResponse = await axios({
            method: "GET",
            url: data.audioUrl,
            responseType: "stream",
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        const writer = fs.createWriteStream(filePath);
        audioResponse.data.pipe(writer);

        writer.on("close", async () => {
            // Send audio with song info and cover thumbnail
            api.sendMessage({
                body: `🎵 𝗛𝗲𝗿𝗲’𝘀 𝘆𝗼𝘂𝗿 𝗦𝗽𝗼𝘁𝗶𝗳𝘆 𝘀𝗼𝗻𝗴!\n\n🎶 Title: ${data.title}\n👤 Artist: ${data.artist}\n🕒 Duration: ${data.duration}`,
                attachment: fs.createReadStream(filePath)
            }, event.threadID, async () => {
                // Send thumbnail after sending audio
                await api.sendMessage({
                    body: "🖼️ 𝗔𝗹𝗯𝘂𝗺 𝗖𝗼𝘃𝗲𝗿",
                    attachment: await axios({
                        method: "GET",
                        url: data.thumbnail,
                        responseType: "stream"
                    }).then(res => res.data)
                }, event.threadID);

                // Cleanup temp file
                fs.unlinkSync(filePath);
            }, event.messageID);
        });

        writer.on("error", err => {
            console.error("Writer error:", err);
            api.sendMessage("🚫 Error downloading the audio. Please try again later.", event.threadID, event.messageID);
        });

    } catch (error) {
        console.error("Error fetching Spotify song:", error);
        api.sendMessage("🚫 Failed to fetch song. Try again later.", event.threadID, event.messageID);
    }
};