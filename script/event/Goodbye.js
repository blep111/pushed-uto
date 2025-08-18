const axios = require('axios');
const fs = require('fs');

module.exports.config = {
    name: "goodbye",
    version: "1.0.0",
};

module.exports.handleEvent = async function ({ api, event }) {
    if (event.logMessageType === "log:unsubscribe") {
        const leftID = event.logMessageData.leftParticipantFbId;
        
        const info = await api.getUserInfo(leftID);
        let name = info[leftID].name;

        // Truncate name if too long
        const maxLength = 15;
        if (name.length > maxLength) {
            name = name.substring(0, maxLength - 3) + '...';
        }

        const groupInfo = await api.getThreadInfo(event.threadID);
        const groupName = groupInfo.threadName || "this group";
        const memberCount = groupInfo.participantIDs 
            ? groupInfo.participantIDs.length 
            : groupInfo.userInfo.length;
        const background = groupInfo?.imageSrc || "https://i.ibb.co/4YBNyvP/images-76.jpg";

        const url = `https://ace-rest-api.onrender.com/api/goodbye?pp=https://i.imgur.com/xwCoQ5H.jpeg&nama=${encodeURIComponent(name)}&bg=${encodeURIComponent(background)}&member=${memberCount}&uid=${leftID}`;

        try {
            const { data } = await axios.get(url, { responseType: 'arraybuffer' });

            if (!fs.existsSync('./script/cache')) {
                fs.mkdirSync('./script/cache', { recursive: true });
            }

            const filePath = './script/cache/goodbye_image.jpg';
            fs.writeFileSync(filePath, Buffer.from(data));

            api.sendMessage({
                body: `👋 ${name} has left ${groupName}. We’ll miss you!`,
                attachment: fs.createReadStream(filePath)
            }, event.threadID, () => fs.unlinkSync(filePath));
        } catch (error) {
            console.error("Error fetching goodbye image:", error);
            api.sendMessage({
                body: `👋 ${name} has left ${groupName}.`
            }, event.threadID);
        }
    }
};