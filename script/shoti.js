const axios = require("axios");
const path = require("path");
const fs = require("fs-extra");

module.exports.config = {
    name: "spotify",
    version: "2.0.0",
    role: 0,
    description: "Fetch Spotify song audio from API.",
    prefix: false,
    premium: false,
    credits: "Gab",
    cooldowns: 3,
    category: "media"
};

module.exports.run = async function ({ api, event, args }) {
    try {
        const songName = args.join(" ");
        if (!songName) {
            return api.sendMessage("🎶 Please type a song name.\nExample: spotify multo cup of joe", event.threadID, event.messageID);
        }

        api.sendMessage(`🎧 Searching for “${songName}” on Spotify...`, event.threadID, event.messageID);

        // Fetch song details
        const url = `https://api.ccprojectsapis-jonell.gleeze.com/api/spotifysearch?q=${encodeURIComponent(songName)}`;
        const response = await axios.get(url, { timeout: 20000 });

        // Validate response
        if (!response.data || !response.data.status || !response.data.data) {
            return api.sendMessage("❌ No song found. Please try another title.", event.threadID, event.messageID);
        }

        const data = response.data.data;
        const audioUrl = data.audio;
        if (!audioUrl) {
            return api.sendMessage("🚫 This song doesn’t have a downloadable audio file.", event.threadID, event.messageID);
        }

        const fileName = `${event.messageID}.mp3`;
        const filePath = path.join(__dirname, fileName);

        // Download audio
        const audioStream = await axios({
            method: "GET",
            url: audioUrl,
            responseType: "stream",
            headers: { "User-Agent": "Mozilla/5.0" },
            maxRedirects: 5
        });

        const writer = fs.createWriteStream(filePath);
        audioStream.data.pipe(writer);

        writer.on("finish", async () => {
            try {
                await api.sendMessage({
                    body: `🎵 𝗦𝗽𝗼𝘁𝗶𝗳𝘆 𝗦𝗼𝗻𝗴 𝗙𝗲𝘁𝗰𝗵𝗲𝗱!\n\n🎶 Title: ${data.title || "Unknown"}\n👤 Artist: ${data.artist || "Unknown"}\n🕒 Duration: ${data.duration || "N/A"}`,
                    attachment: fs.createReadStream(filePath)
                }, event.threadID, () => {
                    fs.unlinkSync(filePath); // clean up
                }, event.messageID);
            } catch (err) {
                console.error("Error sending message:", err.message);
                api.sendMessage("⚠️ Error sending audio. Please try again later.", event.threadID, event.messageID);
            }
        });

        writer.on("error", err => {
            console.error("File write error:", err.message);
            api.sendMessage("🚫 Failed to save or send the audio file.", event.threadID, event.messageID);
        });

    } catch (error) {
        console.error("Main error:", error.message);
        api.sendMessage(`🚫 Failed to fetch song: ${error.message}`, event.threadID, event.messageID);
    }
};