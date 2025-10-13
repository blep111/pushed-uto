const axios = require("axios");

module.exports.config = {
  name: "gpt4oimg",
  version: "3.0.0",
  role: 0,
  hasPrefix: true,
  aliases: ["imgai", "gptimg", "gpt4o-image"],
  description: "Analyze images using GPT-4o. Reply to an image or send a prompt and image.",
  usage: "gpt4oimg <prompt> (reply to an image)",
  credits: "Nax",
  cooldown: 10,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, messageReply } = event;

  // Get prompt
  const prompt = args.length ? args.join(" ") : "Describe this image";

  // Get image URL from the replied message
  let imageUrl;
  if (messageReply && messageReply.attachments && messageReply.attachments.length) {
    const imageAttachment = messageReply.attachments.find(a => a.type === "photo");
    if (imageAttachment && imageAttachment.url) imageUrl = imageAttachment.url;
  }

  if (!imageUrl) {
    return api.sendMessage("❌ Please reply to an image to analyze.", threadID, messageID);
  }

  // Call GPT-4o API with direct image URL
  const apiUrl = `https://api-library-kohi.onrender.com/api/gpt4o?prompt=${encodeURIComponent(prompt)}&imageUrl=${encodeURIComponent(imageUrl)}`;

  try {
    const resp = await axios.get(apiUrl);
    const data = resp.data;
    if (!data || !data.result) {
      return api.sendMessage("❌ Could not get AI analysis result for the image.", threadID, messageID);
    }
    await api.sendMessage(`🧠 GPT-4o Analysis:\n${data.result}`, threadID, messageID);
  } catch (err) {
    console.error("GPT4o API error:", err);
    return api.sendMessage("❌ Failed to get image analysis. Please try again later.", threadID, messageID);
  }
};