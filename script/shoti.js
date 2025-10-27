const axios = require("axios");
const path = require("path");
const fs = require("fs-extra");

module.exports.config = {
    name: "spotify",
    version: "1.1.0",
    role: 0,
    description: "Fetch a Spotify song with its audio and cover.",
    prefix: false,
    premium: false,
    credits: "Gab",
    cooldowns: 10,
    category: "media"
};

module.exports.run = async function ({ api, event, args }) {
    try {
        const songName = args.join(" ");
        if (!songName) {
            return api.sendMessage("🎶 Please enter a song name.\nExample: spotify multo cup of joe", event.threadID, event.messageID);
        }

        api.sendMessage(`🎧 Searching for “${songName}” on Spotify, please wait...`, event.threadID, event.messageID);

        // Fetch song data
        const url = `https://api-library-kohi.onrender.com/api/spotify?song=${encodeURIComponent(songName)}`;
        const response = await axios.get(url);

        if (!response.data || !response.data.status) {
            return api.sendMessage("❌ API error: No data returned. Try another song.", event.threadID, event.messageID);
        }

        const data = response.data.data;
        if (!data || !data.audioUrl) {
            return api.sendMessage("⚠️ Could not find audio link for this song. Try again later.", event.threadID, event.messageID);
        }

        // Check if audio URL is reachable
        try {
            const headCheck = await axios.head(data.audioUrl, { maxRedirects: 5 });
            if (headCheck.status !== 200) throw new Error("Audio link not reachable");
        } catch (err) {
            console.error("Audio link unreachable:", err.message);
            return api.sendMessage("🚫 Audio file cannot be accessed. Please try another song.", event.threadID, event.messageID);
        }

        const fileName = `${event.messageID}.mp3`;
        const filePath = path.join(__dirname, fileName);

        // Download audio
        const audioResponse = await axios({
            method: "GET",
            url: data.audioUrl,
            responseType: "stream",
            headers: { "User-Agent": "Mozilla/5.0" },
            maxRedirects: 5
        });

        const writer = fs.createWriteStream(filePath);
        audioResponse.data.pipe(writer);

        writer.on("close", async () => {
            try {
                // Send the song info + audio
                await api.sendMessage({
                    body: `🎵 𝗛𝗲𝗿𝗲’𝘀 𝘆𝗼𝘂𝗿 𝗦𝗽𝗼𝘁𝗶𝗳𝘆 𝘀𝗼𝗻𝗴!\n\n🎶 Title: ${data.title}\n👤 Artist: ${data.artist}\n🕒 Duration: ${data.duration}`,
                    attachment: fs.createReadStream(filePath)
                }, event.threadID, async () => {
                    // Then send thumbnail
                    try {
                        const imgStream = await axios({
                            method: "GET",
                            url: data.thumbnail,
                            responseType: "stream"
                        }).then(res => res.data);

                        await api.sendMessage({
                            body: "🖼️ 𝗔𝗹𝗯𝘂𝗺 𝗖𝗼𝘃𝗲𝗿",
                            attachment: imgStream
                        }, event.threadID);
                    } catch (imgErr) {
                        console.error("Error fetching thumbnail:", imgErr.message);
                        api.sendMessage("⚠️ Could not load thumbnail image.", event.threadID);
                    }

                    fs.unlinkSync(filePath); // cleanup
                }, event.messageID);
            } catch (sendErr) {
                console.error("Error sending audio:", sendErr.message);
                api.sendMessage("🚫 Failed to send song. Please try again later.", event.threadID, event.messageID);
            }
        });

        writer.on("error", err => {
            console.error("Writer error:", err.message);
            api.sendMessage("🚫 Error saving the audio file.", event.threadID, event.messageID);
        });

    } catch (error) {
        console.error("Main error:", error.message);
        api.sendMessage(`🚫 Failed to fetch song. Reason: ${error.message}`, event.threadID, event.messageID);
    }
};