// modules/commands/screenshot.js

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "ss",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Vern",
  description: "Take a screenshot of a webpage via Haji‑Mix API",
  commandCategory: "utilities",
  usages: "screenshot [url]",
  cooldowns: 5,
  role: 0,
  hasPrefix: true
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const targetUrl = args[0];

  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
    return api.sendMessage(
      "❓ Please provide a valid URL starting with http:// or https://\n\nUsage: screenshot https://example.com",
      threadID,
      messageID
    );
  }

  const apiKey = "4fe7e522-70b7-420b-a746-d7a23db49ee5";
  const apiUrl = `https://kaiz-apis.gleeze.com/api/screenshot?url=${encodeURIComponent(targetUrl)}&api_key=${apiKey}`;

  // Notify user
  await api.sendMessage("🖥️ Generating screenshot, please wait...", threadID, messageID);

  try {
    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
    const buffer = response.data;

    // Ensure cache directory
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    const fileName = `screenshot_${Date.now()}.png`;
    const filePath = path.join(cacheDir, fileName);
    await fs.writeFile(filePath, buffer);

    // Send the screenshot
    return api.sendMessage(
      {
        body: `✅ Screenshot of:\n${targetUrl}`,
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      () => fs.unlinkSync(filePath),
      messageID
    );
  } catch (err) {
    console.error("[screenshot.js] API Error:", err.response?.data || err.message || err);
    return api.sendMessage(
      "🚫 Failed to generate screenshot. Please check the URL and try again later.",
      threadID,
      messageID
    );
  }
};