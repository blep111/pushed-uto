const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "mlbbhero",
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  aliases: ["mlbb-hero", "mlhero"],
  description: "Get Mobile Legends hero info and photo via Kaiz API.",
  usage: "mlbbhero <hero name>",
  credits: "Nax",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!args.length) {
    return api.sendMessage("📌 Usage: mlbbhero <hero name>", threadID, messageID);
  }

  const heroName = args.join(" ").trim();
  const encoded = encodeURIComponent(heroName);
  const apiUrl = `https://kaiz-apis.gleeze.com/api/mlbb-heroes?name=${encoded}&apikey=4fe7e522-70b7-420b-a746-d7a23db49ee5`;

  try {
    // Call Kaiz API
    const resp = await axios.get(apiUrl);
    const hero = resp.data?.response;
    if (!hero || !hero.heroName) {
      return api.sendMessage(`❌ Could not find MLBB hero: ${heroName}`, threadID, messageID);
    }

    // Download thumbnail
    const imgResp = await axios.get(hero.thumbnail, { responseType: "stream" });
    const fileName = `${messageID}-mlhero.png`;
    const filePath = path.join(__dirname, fileName);
    const writer = fs.createWriteStream(filePath);
    imgResp.data.pipe(writer);

    writer.on("close", async () => {
      let msg =
        `🎮 MLBB Hero: ${hero.heroName}\n` +
        (hero.alias ? `• Alias: ${hero.alias}\n` : "") +
        (hero.internalName ? `• Internal Name: ${hero.internalName}\n` : "") +
        (hero.role ? `• Role: ${hero.role}\n` : "") +
        (hero.specialty ? `• Specialty: ${hero.specialty}\n` : "") +
        (hero.laneRecommend ? `• Lane: ${hero.laneRecommend}\n` : "") +
        (hero.price ? `• Price: ${hero.price}\n` : "") +
        (hero.skillResource ? `• Skill Resource: ${hero.skillResource}\n` : "") +
        (hero.damageType ? `• Damage Type: ${hero.damageType}\n` : "") +
        (hero.basicAttackType ? `• Basic Attack: ${hero.basicAttackType}\n` : "") +
        (hero.durability ? `• Durability: ${hero.durability}\n` : "") +
        (hero.offense ? `• Offense: ${hero.offense}\n` : "") +
        (hero.controlEffects ? `• Control Effects: ${hero.controlEffects}\n` : "") +
        (hero.difficulty ? `• Difficulty: ${hero.difficulty}\n` : "") +
        (hero.birthday ? `• Birthday: ${hero.birthday}\n` : "") +
        (hero.born ? `• Born: ${hero.born}\n` : "") +
        (hero.gender ? `• Gender: ${hero.gender}\n` : "") +
        (hero.species ? `• Species: ${hero.species}\n` : "") +
        (hero.occupation ? `• Occupation: ${hero.occupation}\n` : "") +
        (hero.affiliation ? `• Affiliation: ${hero.affiliation}\n` : "") +
        (hero.weapons ? `• Weapons: ${hero.weapons}\n` : "") +
        (hero.abilities ? `• Abilities: ${hero.abilities}\n` : "") +
        (hero.battlesFought ? `• Battles Fought: ${hero.battlesFought}\n` : "") +
        (hero.heroNumber ? `• Hero Number: ${hero.heroNumber}\n` : "") +
        (hero.releaseDate ? `• Release Date: ${hero.releaseDate}\n` : "");

      await api.sendMessage(
        {
          body: msg.trim(),
          attachment: fs.createReadStream(filePath),
        },
        threadID,
        () => fs.unlink(filePath, () => {}),
        messageID
      );
    });

    writer.on("error", (err) => {
      console.error("File write error:", err);
      api.sendMessage("❌ Error downloading hero photo.", threadID, messageID);
    });

  } catch (err) {
    console.error("MLBB Hero API error:", err);
    return api.sendMessage("❌ Failed to get MLBB hero info. Please try again later.", threadID, messageID);
  }
};