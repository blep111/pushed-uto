const fs = require('fs-extra');
const path = require('path');

const balancesFile = path.join(__dirname, 'balances.json');

// Load balances from file or initialize empty
let balances = {};
if (fs.existsSync(balancesFile)) {
  try {
    balances = fs.readJsonSync(balancesFile);
  } catch {
    balances = {};
  }
}

// Helper functions
function saveBalances() {
  fs.writeJsonSync(balancesFile, balances, { spaces: 2 });
}

function getBalance(userID) {
  if (!(userID in balances)) balances[userID] = 2000; // Default starting cash
  return balances[userID];
}

function setBalance(userID, amount) {
  balances[userID] = amount;
  saveBalances();
}

module.exports.config = {
  name: "slot",
  version: "1.2.0",
  role: 0,
  hasPrefix: true,
  aliases: ["slots"],
  description: "Slot machine game. Bet your cash and try your luck!",
  usage: "slot <amount>",
  credits: "ryuko, VernesG",
  cooldown: 5,
};

module.exports.languages = {
  "english": {
    "missingInput": "❌ You didn't specify a bet amount.\nYour current balance: %balance$\nPlease type: slot <amount>",
    "moneyBetNotEnough": "❌ You don't have enough balance for that bet.\nYour balance: %balance$",
    "limitBet": "❌ Your bet is too low, minimum is 50$.\nYour balance: %balance$",
    "returnWin": "%1 | %2 | %3 \n🎉 You won %4$",
    "returnLose": "%1 | %2 | %3\n😢 You lost %4$"
  }
};

module.exports.run = async function({ api, event, args, getText }) {
  const { threadID, messageID, senderID } = event;
  const slotItems = ["🖕", "❤️", "👉", "👌", "🥀", "🍓", "🍒", "🍌", "🥝", "🥑", "🌽"];
  let moneyUser = getBalance(senderID);

  let moneyBet = parseInt(args[0]);

  // Interactive prompt if no amount provided
  if (isNaN(moneyBet) || moneyBet <= 0) {
    return api.sendMessage(
      getText("missingInput").replace("%balance", moneyUser),
      threadID,
      messageID
    );
  }

  if (moneyBet > moneyUser) {
    return api.sendMessage(
      getText("moneyBetNotEnough").replace("%balance", moneyUser),
      threadID,
      messageID
    );
  }

  if (moneyBet < 50) {
    return api.sendMessage(
      getText("limitBet").replace("%balance", moneyUser),
      threadID,
      messageID
    );
  }

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

  return api.sendMessage(msg + `\n\n💰 Your current balance: ${getBalance(senderID)}$`, threadID, messageID);
};