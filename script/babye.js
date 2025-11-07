module.exports.config = {
		name: "babye",
		version: "1.0.0",
		role: 2,
		credits: "vrax",
		description: "Remove all group members.",
		usages: "{p}kickall",
		hasPrefix: false,
		cooldown: 5,
};

let fontEnabled = true;

function formatFont(text) {
	const fontMapping = {
		a: "𝖺", b: "𝖻", c: "𝖼", d: "𝖽", e: "𝖾", f: "𝖿", g: "𝗀", h: "𝗁", i: "𝗂", j: "𝗃", k: "𝗄", l: "𝗅", m: "𝗆",
		n: "𝗇", o: "𝗈", p: "𝗉", q: "𝗊", r: "𝗋", s: "𝗌", t: "𝗍", u: "𝗎", v: "𝗏", w: "𝗐", x: "𝗑", y: "𝗒", z: "𝗓",
		A: "𝖠", B: "𝖡", C: "𝖢", D: "𝖣", E: "𝖤", F: "𝖥", G: "𝖦", H: "𝖧", I: "𝖨", J: "𝖩", K: "𝖪", L: "𝖫", M: "𝖬",
		N: "𝖭", O: "𝖮", P: "𝖯", Q: "𝖰", R: "𝖱", S: "𝖲", T: "𝖳", U: "𝖴", V: "𝖵", W: "𝖶", X: "𝖷", Y: "𝖸", Z: "𝖹"
	};

	let formattedText = "";
	for (const char of text) {
		if (fontEnabled && char in fontMapping) {
			formattedText += fontMapping[char];
		} else {
			formattedText += char;
		}
	}

	return formattedText;
}

module.exports.run = async ({ api, event, getText, args, admin }) => {
        const senderID = event.senderID.toString();
        if (!admin.includes(senderID)) {
          return api.sendMessage("𝖸𝗈𝗎 𝖽𝗈𝗇'𝗍 𝗁𝖺𝗏𝖾 𝗉𝖾𝗋𝗆𝗂𝗌𝗌𝗂𝗈𝗇 𝗍𝗈 𝗎𝗌𝖾 𝗍𝗁𝗂𝗌 𝖼𝗈𝗆𝗆𝖺𝗇𝖽.", event.threadID, event.messageID);
        }
	const { participantIDs } = await api.getThreadInfo(event.threadID)
	function delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	};
	const botID = api.getCurrentUserID();
	const listUserID = participantIDs.filter(ID => ID != botID);
	return api.getThreadInfo(event.threadID, (err, info) => {
		if (err) return api.sendMessage(formatFont("» An error occurred."), event.threadID);
		if (!info.adminIDs.some(item => item.id == api.getCurrentUserID()))
			return api.sendMessage(formatFont(`» Need group admin rights.\nPlease add and try again.`), event.threadID, event.messageID);
		if (info.adminIDs.some(item => item.id == event.senderID)) {
			setTimeout(function() { api.removeUserFromGroup(botID, event.threadID) }, 300000);
			return api.sendMessage(formatFont(`» Start deleting all members. Bye everyone.`), event.threadID, async (error, info) => {
				for (let id in listUserID) {
					await new Promise(resolve => setTimeout(resolve, 1000));
					api.removeUserFromGroup(listUserID[id], event.threadID)
				}
			})
		} else return api.sendMessage(formatFont('» Only group admins can use this command.'), event.threadID, event.messageID);
	})
}