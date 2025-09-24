const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports.config = {
    name: "fbdp",
    version: "1.0",
    role: 0,   // anyone can use
    description: "Fetch Facebook profile picture by user ID.",
    prefix: true,
    credits: "Vern",
    cooldowns: 5,
    category: "image"
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (args.length === 0) {
        return api.sendMessage(
            "⚠️ Please provide a Facebook user ID.\n📌 Usage: fbdp <facebook_id>\n💬 Example: fbdp 61579990924831",
            threadID,
            messageID
        );
    }

    const id = args[0];
    const apiUrl = `https://kaiz-apis.gleeze.com/api/facebookpfp?uid=${id}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

    try {
        // First call Kaiz API to get the PFP link
        const res = await axios.get(apiUrl);
        if (!res.data || !res.data.url) {
            return api.sendMessage("❌ Failed to fetch avatar. Invalid API response.", threadID, messageID);
        }

        const imageUrl = res.data.url;

        // Download the image as a stream
        const response = await axios({
            url: imageUrl,
            method: "GET",
            responseType: "stream",
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        const cacheDir = path.join(__dirname, "cache");
        await fs.ensureDir(cacheDir);

        const imagePath = path.join(cacheDir, `fbdp_${Date.now()}.jpg`);
        const writer = fs.createWriteStream(imagePath);

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        const imageStream = fs.createReadStream(imagePath);

        api.sendMessage(
            {
                body: `✅ Here is the Facebook avatar of ID: ${id}\n> Powered by Kaiz API`,
                attachment: imageStream
            },
            threadID,
            async () => {
                try {
                    await fs.unlink(imagePath);
                } catch (unlinkErr) {
                    console.error("❌ Error deleting temp image file:", unlinkErr);
                }
            },
            messageID
        );

    } catch (error) {
        console.error("❌ Error fetching avatar:", error);
        return api.sendMessage(
            "❌ Failed to fetch the avatar. Please check the ID or try again later.",
            threadID,
            messageID
        );
    }
};