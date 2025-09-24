const axios = require('axios');

module.exports.config = {
  name: "fbdp",
  version: "1.1.0",
  role: 0,
  credits: "vern",
  description: "Get Facebook profile picture by user ID (via Kaiz API).",
  usage: "/hack <facebook_id>",
  prefix: true,
  cooldowns: 3,
  commandCategory: "Image"
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const prefix = "/"; // Adjust if your bot uses a different prefix

  if (args.length < 1) {
    const usageMessage =
      `════『 𝗙𝗔𝗖𝗘𝗕𝗢𝗢𝗞 𝗔𝗩𝗔𝗧𝗔𝗥 』════\n\n` +
      `⚠️ Please provide a Facebook user ID.\n\n` +
      `📌 Usage: ${prefix}hack <facebook_id>\n` +
      `💬 Example: ${prefix}hack 61579990924831\n\n` +
      `> vern cute`;
    return api.sendMessage(usageMessage, threadID, messageID);
  }

  const id = args[0];
  const apiUrl = `https://kaiz-apis.gleeze.com/api/facebookpfp?uid=${id}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

  try {
    // Loading message
    const waitMsg = `════『 𝗙𝗔𝗖𝗘𝗕𝗢𝗢𝗞 𝗔𝗩𝗔𝗧𝗔𝗥 』════\n\n📤 Fetching avatar for ID: ${id}\nPlease wait...`;
    await api.sendMessage(waitMsg, threadID, messageID);

    // Call the Kaiz API
    const res = await axios.get(apiUrl);

    if (!res.data || !res.data.url) {
      return api.sendMessage(
        `🚫 Could not retrieve avatar.\nReason: API returned invalid response.`,
        threadID,
        messageID
      );
    }

    // Fetch the actual image as a stream
    const imgStream = await axios.get(res.data.url, { responseType: "stream" });

    // Send the image as an attachment
    return api.sendMessage(
      {
        body: `Here is the Facebook avatar of ID: ${id}\n\n> Powered by Kaiz API`,
        attachment: imgStream.data
      },
      threadID,
      messageID
    );
  } catch (error) {
    console.error('❌ Error in hack command:', error.message || error);

    const errorMessage =
      `════『 𝗙𝗔𝗖𝗘𝗕𝗢𝗢𝗞 𝗔𝗩𝗔𝗧𝗔𝗥 𝗘𝗥𝗥𝗢𝗥 』════\n\n` +
      `🚫 Failed to fetch the avatar.\nReason: ${error.response?.data?.error || error.message || 'Unknown error'}\n\n` +
      `> Please try again later.`;

    return api.sendMessage(errorMessage, threadID, messageID);
  }
};