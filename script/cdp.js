const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "cdp",
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  aliases: ["cdpimg", "cdpphoto"],
  description: "Get images from the CDP API.",
  usage: "cdp",
  credits: "Nax",
  cooldown: 10,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  const apiUrl = "https://xvi-rest-api.vercel.app/api/cdp";

  try {
    // Call the API
    const resp = await axios.get(apiUrl);
    const data = resp.data;
    if (!data || !data.result || !data.result.one || !data.result.two) {
      return api.sendMessage("❌ Could not get CDP images.", threadID, messageID);
    }

    // Download both images
    const imgRespOne = await axios.get(data.result.one, { responseType: "stream" });
    const imgRespTwo = await axios.get(data.result.two, { responseType: "stream" });

    const fileNameOne = `${messageID}-cdp-1.jpeg`;
    const fileNameTwo = `${messageID}-cdp-2.jpeg`;
    const filePathOne = path.join(__dirname, fileNameOne);
    const filePathTwo = path.join(__dirname, fileNameTwo);

    const writerOne = fs.createWriteStream(filePathOne);
    const writerTwo = fs.createWriteStream(filePathTwo);

    imgRespOne.data.pipe(writerOne);
    imgRespTwo.data.pipe(writerTwo);

    // Wait for both to finish
    let finished = 0;
    let errorOccurred = false;
    function cleanupAndSend() {
      finished++;
      if (finished === 2 && !errorOccurred) {
        api.sendMessage(
          {
            body: `🖼️ CDP Images\nCreator: ${data.creator}`,
            attachment: [
              fs.createReadStream(filePathOne),
              fs.createReadStream(filePathTwo)
            ]
          },
          threadID,
          () => {
            fs.unlink(filePathOne, () => {});
            fs.unlink(filePathTwo, () => {});
          },
          messageID
        );
      }
    }

    function handleError(errMsg) {
      errorOccurred = true;
      fs.unlink(filePathOne, () => {});
      fs.unlink(filePathTwo, () => {});
      api.sendMessage(errMsg, threadID, messageID);
    }

    writerOne.on("close", cleanupAndSend);
    writerTwo.on("close", cleanupAndSend);

    writerOne.on("error", (err) => {
      console.error("File write error (one):", err);
      handleError("❌ Error downloading first image.");
    });
    writerTwo.on("error", (err) => {
      console.error("File write error (two):", err);
      handleError("❌ Error downloading second image.");
    });

  } catch (err) {
    console.error("CDP API error:", err);
    return api.sendMessage("❌ Failed to get CDP images. Please try again later.", threadID, messageID);
  }
};