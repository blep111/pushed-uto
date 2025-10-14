// User balances, in-memory only
const balances = {};

module.exports.config = {
  name: "slot",
  version: "1.0.2",
  permission: 0,
  credits: "Nax",
  premium: false,
  prefix: false,
  description: "slot game",
  category: "without prefix",
  usages: "slot (amount)",
  cooldowns: 5,
};

module.exports.languages = {
  "bangla": {
    "missingInput": "the bet money must not be blank or a negative number.",
    "moneyBetNotEnough": "the money you betted is bigger than your balance.",
    "limitBet": "your bet is too low, the minimum is 50 pesos.",
    "returnWin": "%1 | %2 | %3 \nyou won %4$",
    "returnLose": "%1 | %2 | %3\nyou loss %4$"
  },
  "english": {
    "missingInput": "the bet money must not be blank or a negative number.",
    "moneyBetNotEnough": "the money you betted is bigger than your balance.",
    "limitBet": "your bet is too low, the minimum is 50 pesos.",
    "returnWin": "%1 | %2 | %3 \nyou won %4$",
    "returnLose": "%1 | %2 | %3\nyou loss %4$"
  }
}

// Helper to get/set user balance
function getBalance(userID) {
  if (!(userID in balances)) balances[userID] = 2000; // Default starting cash
  return balances[userID];
}
function setBalance(userID, amount) {
  balances[userID] = amount;
}

module.exports.run = async function({ api, event, args, getText }) {
  const { threadID, messageID, senderID } = event;
  const slotItems = ["🖕", "❤️", "👉", "👌", "🥀", "🍓", "🍒", "🍌", "🥝", "🥑", "🌽"];
  let moneyUser = getBalance(senderID);

  var moneyBet = parseInt(args[0]);
  if (isNaN(moneyBet) || moneyBet <= 0)
    return api.sendMessage(getText("missingInput"), threadID, messageID);

  if (moneyBet > moneyUser)
    return api.sendMessage(getText("moneyBetNotEnough"), threadID, messageID);

  if (moneyBet < 50)
    return api.sendMessage(getText("limitBet"), threadID, messageID);

  // Slot roll
  const slot1 = slotItems[Math.floor(Math.random() * slotItems.length)];
  const slot2 = slotItems[Math.floor(Math.random() * slotItems.length)];
  const slot3 = slotItems[Math.floor(Math.random() * slotItems.length)];

  let msg = "";
  if (slot1 === slot2 && slot2 === slot3) {
    // Win
    const winAmount = moneyBet * 2;
    setBalance(senderID, moneyUser + winAmount);
    msg = getText("returnWin")
      .replace("%1", slot1)
      .replace("%2", slot2)
      .replace("%3", slot3)
      .replace("%4", winAmount);
  } else {
    // Lose
    setBalance(senderID, moneyUser - moneyBet);
    msg = getText("returnLose")
      .replace("%1", slot1)
      .replace("%2", slot2)
      .replace("%3", slot3)
      .replace("%4", moneyBet);
  }
  return api.sendMessage(msg + `\n\nYour balance: ${getBalance(senderID)}$`, threadID, messageID);
};