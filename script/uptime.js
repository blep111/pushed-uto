const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "uptime",
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  aliases: ["botuptime", "upimg"],
  description: "Get bot uptime image from Kaiz API.",
  usage: "uptime",
  credits: "Kaizenji, VernesG",
  cooldown: 10,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  // You can change these values if you want to make them dynamic via args
  const instag = "vernesg";
  const ghub = "https://github.com/vernesg";
  const fb = "https://www.facebook.com/profile.php?id=61581526372855";
  const hours = "24 hours";
  const minutes = "60 minutes";
  const seconds = "60 seconds";
  const botname = "Nax";
  const apikey = "4fe7e522-70b7-420b-a746-d7a23db49ee5";

  const apiUrl = `https://kaiz-apis.gleeze.com/api/uptime?instag=${encodeURIComponent(instag)}&ghub=${encodeURIComponent(ghub)}&fb=${encodeURIComponent(fb)}&hours=${encodeURIComponent(hours)}&minutes=${encodeURIComponent(minutes)}&seconds=${encodeURIComponent(seconds)}&botname=${encodeURIComponent(botname)}&apikey=${apikey}`;

  try {
    // Call Kaiz API
    const resp = await axios.get(apiUrl);
    const data = resp.data;
    if (!data || !data.image) {
      return api.sendMessage(`❌ Could not get uptime image for ${botname}`, threadID, messageID);
    }

    // Download image file
    const imgResp = await axios.get(data.image, { responseType: "stream" });
    const fileName = `${messageID}-uptime.png`;
    const filePath = path.join(__dirname, fileName);
    const writer = fs.createWriteStream(filePath);
    imgResp.data.pipe(writer);

    writer.on("finish", async () => {
      await api.sendMessage(
        {
          body: `🤖 Uptime for ${botname}`,
          attachment: fs.createReadStream(filePath),
        },
        threadID,
        () => fs.unlink(filePath, () => {}),
        messageID
      );
    });

    writer.on("error", (err) => {
      console.error("File write error:", err);
      api.sendMessage("❌ Error downloading uptime image.", threadID, messageID);
    });

  } catch (err) {
    console.error("Uptime API error:", err);
    return api.sendMessage("❌ Failed to get uptime image. Please try again later.", threadID, messageID);
  }
};