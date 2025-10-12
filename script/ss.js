const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "ss",
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  aliases: [],
  description: "Take a screenshot of a URL via Urangkapolka API",
  usage: "screenshot <url>",
  credits: "You",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (args.length === 0) {
    return api.sendMessage("📌 Usage: screenshot <url>", threadID, messageID);
  }

  const targetUrl = args[0].trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    return api.sendMessage("⚠️ Please provide a valid URL starting with http:// or https://", threadID, messageID);
  }

  const encoded = encodeURIComponent(targetUrl);
  const apiUrl = `https://urangkapolka.vercel.app/api/screenshot?url=${encoded}`;

  try {
    // Step 1: Get screenshot info from API
    const resp = await axios.get(apiUrl);
    // The API response: { status: "success", image: "https://..." }
    if (!resp.data || resp.data.status !== "success" || !resp.data.image) {
      throw new Error("No image link returned from API");
    }
    const imageUrl = resp.data.image;

    // Step 2: Download the image from the returned URL
    const imgResp = await axios.get(imageUrl, { responseType: "stream" });

    // Step 3: Save to temp file, send then clean up
    const fileName = `${messageID}.png`;
    const filePath = path.join(__dirname, fileName);

    const writer = fs.createWriteStream(filePath);
    imgResp.data.pipe(writer);

    writer.on('close', async () => {
      await api.sendMessage(
        {
          body: `📷 Screenshot of: ${targetUrl}`,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => fs.unlink(filePath, () => {}),
        messageID
      );
    });

    writer.on('error', (err) => {
      console.error("File write error:", err);
      api.sendMessage("❌ Error saving screenshot file.", threadID, messageID);
    });

  } catch (err) {
    console.error("Screenshot API error:", err);
    return api.sendMessage("❌ Failed to get screenshot. Please try again later.", threadID, messageID);
  }
};