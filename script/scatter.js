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
  name: "scatter",
  version: "1.0.0",
  role: 0,
  aliases: ["scattergame", "scatterbet"],
  description: "Scatter game mini-game. Bet your balance and try your luck!",
  usage: "scatter <amount>",
  credits: "Nax",
  cooldown: 5,
};

module.exports.languages = {
  english: {
    missingInput: "❌ You need to specify the amount you want to bet.",
    moneyBetNotEnough: "❌ You don't have enough balance for that bet.",
    limitBet: "❌ Minimum bet is $50.",
    winMessage: "🎉 %1 | %2 | %3\nYou won $%4!",
    loseMessage: "💥 %1 | %2 | %3\nYou lost $%4."
  }
};

module.exports.run = async function({ api, event, args, getText }) {
  const { threadID, messageID, senderID } = event;

  const bet = parseInt(args[0]);
  if (!bet || bet <= 0) return api.sendMessage(getText("missingInput"), threadID, messageID);

  const balance = getBalance(senderID);
  if (bet > balance) return api.sendMessage(getText("moneyBetNotEnough"), threadID, messageID);
  if (bet < 50) return api.sendMessage(getText("limitBet"), threadID, messageID);

  const symbols = ["🍎", "🍌", "🍒", "🍇", "🍉", "🍋"];
  const scatter1 = symbols[Math.floor(Math.random() * symbols.length)];
  const scatter2 = symbols[Math.floor(Math.random() * symbols.length)];
  const scatter3 = symbols[Math.floor(Math.random() * symbols.length)];

  let resultMsg = "";

  // Winning condition: 2 or 3 same symbols
  if (scatter1 === scatter2 && scatter2 === scatter3) {
    const win = bet * 3;
    setBalance(senderID, balance + win);
    resultMsg = getText("winMessage").replace("%1", scatter1).replace("%2", scatter2).replace("%3", scatter3).replace("%4", win);
  } else if (scatter1 === scatter2 || scatter1 === scatter3 || scatter2 === scatter3) {
    const win = bet * 1.5;
    setBalance(senderID, balance + win);
    resultMsg = getText("winMessage").replace("%1", scatter1).replace("%2", scatter2).replace("%3", scatter3).replace("%4", win);
  } else {
    setBalance(senderID, balance - bet);
    resultMsg = getText("loseMessage").replace("%1", scatter1).replace("%2", scatter2).replace("%3", scatter3).replace("%4", bet);
  }

  return api.sendMessage(resultMsg + `\n💰 Your balance: $${getBalance(senderID)}`, threadID, messageID);
};