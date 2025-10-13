const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "screenshot",
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  aliases: ["ss", "webshot"],
  description: "Get a screenshot of a website using XVI Rest API.",
  usage: "screenshot <website-url>",
  credits: "Nax",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!args.length) {
    return api.sendMessage("📌 Usage: screenshot <website-url>", threadID, messageID);
  }

  const targetUrl = args.join(" ").trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    return api.sendMessage("⚠️ Please provide a valid URL starting with http:// or https://", threadID, messageID);
  }

  const apiUrl = `https://xvi-rest-api.vercel.app/api/screenshot?url=${encodeURIComponent(targetUrl)}`;

  try {
    // Call the API
    const resp = await axios.get(apiUrl);
    const data = resp.data;
    if (!data || !data.result || !data.result.screenshot) {
      return api.sendMessage("❌ Could not get screenshot for this website.", threadID, messageID);
    }

    // Download the screenshot image
    const imgResp = await axios.get(data.result.screenshot, { responseType: "stream" });
    const fileName = `${messageID}-screenshot.png`;
    const filePath = path.join(__dirname, fileName);
    const writer = fs.createWriteStream(filePath);
    imgResp.data.pipe(writer);

    writer.on("finish", async () => {
      await api.sendMessage(
        {
          body: `📷 Screenshot of: ${targetUrl}`,
          attachment: fs.createReadStream(filePath),
        },
        threadID,
        () => fs.unlink(filePath, () => {}),
        messageID
      );
    });

    writer.on("error", (err) => {
      console.error("File write error:", err);
      api.sendMessage("❌ Error downloading screenshot file.", threadID, messageID);
    });

  } catch (err) {
    console.error("Screenshot API error:", err);
    return api.sendMessage("❌ Failed to get screenshot. Please try again later.", threadID, messageID);
  }
};