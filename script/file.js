const fs = require('fs');

module.exports.config = {
  name: "file",
  version: "2.4.3",
  credits: "f",
  cooldown: 0,
  hasPrefix: false,
  usage: "file <filename>",
  role: 2,
};

module.exports.run = async function ({ args, api, event }) {
  const allowedUIDs = ["61579270641452", "61579270641452"]; // ✅ Add your allowed UIDs here

  if (!allowedUIDs.includes(event.senderID)) {
    return api.sendMessage("❌ You are not allowed to use this command.", event.threadID, event.messageID);
  }

  const fileName = args[0];
  if (!fileName) {
    return api.sendMessage("❗ Please provide a file name.", event.threadID, event.messageID);
  }

  const filePath = __dirname + `/${fileName}.js`;
  if (!fs.existsSync(filePath)) {
    return api.sendMessage(`❌ File not found: ${fileName}.js`, event.threadID, event.messageID);
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  api.sendMessage({ body: fileContent }, event.threadID);
};