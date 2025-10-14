const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const jimp = require('jimp');

module.exports.config = {
    name: "fakechat",
    version: "1.0.0",
    role: 0,
    hasPrefix: true,
    aliases: [],
    description: "Create a fake Facebook chat image with the mentioned user.",
    usage: "fakechat @mention | text",
    credits: "Nax",
    cooldown: 5,
    category: "fun"
};

module.exports.run = async function ({ api, event, args }) {
    let a = "someone";
    const mentionIndex = args.findIndex(arg => arg.startsWith('@'));
    if (mentionIndex !== -1 && mentionIndex + 1 < args.length) {
        const mentionParts = args[mentionIndex].split('@');
        a = mentionParts[1];
        args.splice(mentionIndex, 1);
    }

    const textParts = args.join(" ").split('|').map(part => part.trim());

    const mention = Object.keys(event.mentions);
    if (mention.length === 0) return api.sendMessage("Please mention someone. ex: @mention | text", event.threadID, event.messageID);

    const mentionedUserID = mention[0];
    const mentionedUserProfilePic = await getUserProfilePic(mentionedUserID);

    if (!mentionedUserProfilePic) {
        return api.sendMessage("Failed to load profile picture.", event.threadID, event.messageID);
    }

    if (a.toLowerCase() === "haker" || a.toLowerCase() === "kshitiz") {
        return api.sendMessage("You cannot use this name.", event.threadID, event.messageID);
    }

    const circleSize = 60;
    const avtwo = await createCircularImage(mentionedUserProfilePic, circleSize);

    const canvas = createCanvas(720, 405);
    const ctx = canvas.getContext('2d');

    const background = await loadImage("https://i.ibb.co/SVmYmrn/420578140-383334164549458-685915027190897272-n.jpg");
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    await drawImage(ctx, avtwo, 30, 160);

    ctx.font = '22px Arial';
    ctx.fillStyle = 'rgba(128, 128, 128, 0.8)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const originalFontSize = ctx.font;
    ctx.font = '19px Arial';
    ctx.fillText(`${a}`, 95 + circleSize + 1, 140);
    ctx.font = originalFontSize;

    const text = textParts[1];
    const textWidth = ctx.measureText(text).width;
    const textHeight = 25;
    const textPadding = 10;
    const textBoxWidth = textWidth + 2 * textPadding;
    const textBoxHeight = textHeight + 2 * textPadding;
    const textBoxX = 110;
    const textBoxY = 160;

    const borderRadius = 20;
    ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
    ctx.beginPath();
    ctx.moveTo(textBoxX + borderRadius, textBoxY);
    ctx.lineTo(textBoxX + textBoxWidth - borderRadius, textBoxY);
    ctx.arcTo(textBoxX + textBoxWidth, textBoxY, textBoxX + textBoxWidth, textBoxY + textBoxHeight / 2, borderRadius);
    ctx.arcTo(textBoxX + textBoxWidth, textBoxY + textBoxHeight, textBoxX + textBoxWidth - borderRadius, textBoxY + textBoxHeight, borderRadius);
    ctx.lineTo(textBoxX + borderRadius, textBoxY + textBoxHeight);
    ctx.arcTo(textBoxX, textBoxY + textBoxHeight, textBoxX, textBoxY + textBoxHeight / 2, borderRadius);
    ctx.arcTo(textBoxX, textBoxY, textBoxX + borderRadius, textBoxY, borderRadius);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, textBoxX + textBoxWidth / 2, textBoxY + textBoxHeight / 2);

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const imgPath = path.join(cacheDir, `result_image.png`);
    const out = fs.createWriteStream(imgPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    out.on('finish', () => {
        api.sendMessage({ attachment: fs.createReadStream(imgPath) }, event.threadID, () => fs.unlinkSync(imgPath), event.messageID);
    });
};

async function getUserProfilePic(userID) {
    try {
        const response = await axios.get(
            `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
            { responseType: 'arraybuffer' }
        );
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error("Error fetching profile picture:", error);
        return null;
    }
}

async function createCircularImage(imageData, size) {
    const img = await jimp.read(imageData);
    img.resize(size, size);
    img.circle();
    return await img.getBufferAsync(jimp.MIME_PNG);
}

async function drawImage(ctx, imageData, x, y) {
    try {
        const image = await loadImage(imageData);
        ctx.drawImage(image, x, y);
    } catch (error) {
        console.error("Error drawing image:", error);
    }
}