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
  name: "collect",
  version: "1.0.0",
  role: 0,
  aliases: ["work", "money", "earn"],
  description: "Collect some cash to add to your balance.",
  usage: "collect",
  credits: "Nax",
  cooldown: 10, // Optional: prevent spamming
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const currentBalance = getBalance(senderID);

  // Random earning amount between 50 and 500
  const earnedAmount = Math.floor(Math.random() * 451) + 50;

  // Update balance
  setBalance(senderID, currentBalance + earnedAmount);

  return api.sendMessage(
    `💵 You earned $${earnedAmount}!\n💰 Your new balance: $${getBalance(senderID)}`,
    threadID,
    messageID
  );
};