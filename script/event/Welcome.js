const axios = require('axios');
const fs = require('fs');
const path = require('path'); // Added for path manipulation

module.exports.config = {
  name: "welcome",
  version: "1.0.0",
};

module.exports.handleEvent = async function({ api, event }) {
  if (event.logMessageType === "log:subscribe") {
    const addedParticipants = event.logMessageData.addedParticipants;
    const senderID = addedParticipants[0].userFbId;

    try {
      const userInfo = await api.getUserInfo(senderID);
      const name = userInfo[senderID].name.substring(0, 12) + "..."; // Safer truncation

      const groupInfo = await api.getThreadInfo(event.threadID);
      const groupName = groupInfo.threadName || "this group";
      const background = groupInfo.imageSrc || "https://i.ibb.co/4YBNyvP/images-76.jpg";
      const memberCount = groupInfo.participantIDs.length;

      // Improved URL construction - removes unnecessary Lance etc.
      const url = `https://ace-rest-api.onrender.com/api/welcome?username=${encodeURIComponent(name)}&groupname=${encodeURIComponent(groupName)}&bg=${encodeURIComponent(background)}&memberCount=${memberCount}`;


      const tempDir = path.join(__dirname, 'temp'); // Create a temporary directory for the image
      fs.mkdirSync(tempDir, { recursive: true }); // Ensure the directory exists

      const filePath = path.join(tempDir, 'welcome_image.jpg');

      const response = await axios.get(url, { responseType: 'arraybuffer' });
      fs.writeFileSync(filePath, Buffer.from(response.data));

      api.sendMessage({
        body: `Everyone welcome the new member ${name} to ${groupName}!`,
        attachment: fs.createReadStream(filePath),
      }, event.threadID, () => fs.unlinkSync(filePath)); //Delete after sending

    } catch (error) {
      console.error("Error processing welcome message:", error);
      api.sendMessage({ body: `Everyone welcome the new member ${name} to ${groupName}!` }, event.threadID);
    }
  }
};