const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "girl",
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  aliases: ["ag", "aestheticgirls", "aestheticsgirl", "aestheticsgirls"],
  description: "Get random aesthetic girls video.",
  usage: "aestheticgirl",
  credits: "Nax",
  cooldown: 30,
  category: "fun"
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  api.setMessageReaction("✨", messageID, () => {}, true);

  try {
    const response = await axios.get("https://aesthetic-girls.onrender.com/kshitiz");
    const postData = response.data.posts;
    if (!postData || !Array.isArray(postData) || postData.length === 0)
      return api.sendMessage("Sorry, no videos found.", threadID, messageID);

    const randomPost = postData[Math.floor(Math.random() * postData.length)];
    // randomPost is an array of URLs
    const videoUrls = randomPost.map(url => url.replace(/\\/g, "/"));
    const selectedUrl = videoUrls[Math.floor(Math.random() * videoUrls.length)];

    // Download video
    const videoResp = await axios.get(selectedUrl, { responseType: "stream" });
    const tempVideoPath = path.join(__dirname, `${Date.now()}-ag.mp4`);
    const writer = fs.createWriteStream(tempVideoPath);
    videoResp.data.pipe(writer);

    writer.on("finish", async () => {
      await api.sendMessage({
        body: "",
        attachment: fs.createReadStream(tempVideoPath),
      }, threadID, () => {
        fs.unlink(tempVideoPath, () => {});
        api.setMessageReaction("✅", messageID, () => {}, true);
      }, messageID);
    });

    writer.on("error", (err) => {
      fs.unlink(tempVideoPath, () => {});
      api.sendMessage("Sorry, an error occurred while downloading video.", threadID, messageID);
    });

  } catch (error) {
    console.error(error);
    api.sendMessage("Sorry, an error occurred while processing your request.", threadID, messageID);
  }
};