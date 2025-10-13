const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "fbcover",
  version: "1.0.0",
  role: 0,
  credits: "Nax",
  description: "Generates a Facebook cover using provided details.",
  hasPrefix: true,
  aliases: ["fbcover"],
  usage: "fbcover <name>|<subname>|<number>|<address>|<email>|<uid>|<color>",
  cooldown: 5
};

module.exports.run = async function({ api, event, args }) {
  try {
    if (!args || args.length === 0) {
      return api.sendMessage(
        "Please provide all details to generate a Facebook cover.\n\nExample:\nfbcover Mark|Zuckerberg|4886|USA|zuck@gmail.com|10092939929|Blue",
        event.threadID
      );
    }

    const details = args.join(" ").split("|");

    if (details.length < 7) {
      return api.sendMessage(
        "Invalid format. Make sure you use '|' to separate each field.\n\nExample:\nfbcover Mark|Zuckerberg|12345|USA|zuck@gmail.com|10092939929|Blue",
        event.threadID
      );
    }

    const [name, subname, sdt, address, email, uid, color] = details.map(d => encodeURIComponent(d.trim()));
    const apiUrl = `https://api.zetsu.xyz/canvas/fbcover?name=${name}&subname=${subname}&sdt=${sdt}&address=${address}&email=${email}&uid=${uid}&color=${color}&apikey=6fbd0a144a296d257b30a752d4a178a5`;
    const imagePath = path.join(__dirname, "fbcover.png");

    api.sendMessage("Generating Facebook cover, please wait...", event.threadID);

    const response = await axios({
      url: apiUrl,
      method: "GET",
      responseType: "stream"
    });

    const writer = fs.createWriteStream(imagePath);
    response.data.pipe(writer);

    writer.on("finish", async () => {
      try {
        await api.sendMessage(
          {
            attachment: fs.createReadStream(imagePath)
          },
          event.threadID
        );
        fs.unlinkSync(imagePath);
      } catch (sendErr) {
        console.error("Error sending image:", sendErr);
        api.sendMessage("Error sending the image.", event.threadID);
      }
    });

    writer.on("error", (err) => {
      console.error("Stream error:", err);
      api.sendMessage("Error while generating the image. Try again later.", event.threadID);
    });
  } catch (error) {
    console.error("General error:", error);
    api.sendMessage("An unexpected error occurred. Please try again later.", event.threadID);
  }
};