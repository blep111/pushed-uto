const axios = require('axios');
const fs = require('fs');

module.exports.config = {
    name: "welcome",
    version: "1.0.0",
};

module.exports.handleEvent = async function ({ api, event }) {
    if (event.logMessageType === "log:subscribe") {
        const addedParticipants = event.logMessageData.addedParticipants;
        const senderID = addedParticipants[0].userFbId;
        let name = await api.getUserInfo(senderID).then(info => info[senderID].name);

        // Truncate long names
        const maxLength = 15;
        if (name.length > maxLength) {
            name = name.substring(0, maxLength - 3) + '...';
        }

        const groupInfo = await api.getThreadInfo(event.threadID);
        const groupIcon = groupInfo.imageSrc || "https://i.ibb.co/G5mJZxs/rin.jpg";
        const memberCount = groupInfo.participantIDs.length;
        const groupName = groupInfo.threadName || "this group";
        const background = groupInfo.imageSrc || "https://i.ibb.co/4YBNyvP/images-76.jpg";

        // Build clean URL
        const url = `https://ace-rest-api.onrender.com/api/welcome?username=${encodeURIComponent(name)}&avatarUrl=https://i.imgur.com/xwCoQ5H.jpeg&uid=${senderID}&groupname=${encodeURIComponent(groupName)}&bg=${encodeURIComponent(background)}&memberCount=${memberCount}`;

        try {
            const { data } = await axios.get(url, { responseType: 'arraybuffer' });

            // Ensure cache folder exists
            const dir = './script/cache';
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            const filePath = `${dir}/welcome_image.jpg`;
            fs.writeFileSync(filePath, Buffer.from(data));

            api.sendMessage({
                body: `Everyone welcome the new member ${name} to ${groupName}!`,
                attachment: fs.createReadStream(filePath)
            }, event.threadID, () => fs.unlinkSync(filePath));
        } catch (error) {
            console.error("Error fetching welcome image:", error);
            api.sendMessage({
                body: `Everyone welcome the new member ${name} to ${groupName}!`
            }, event.threadID);
        }
    }
};