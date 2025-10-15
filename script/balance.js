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

// Get user's balance and name
function getBalance(userID, userName = 'Unknown') {
  if (!(userID in balances)) {
    balances[userID] = { name: userName, balance: 2000 }; // default balance
    saveBalances();
  }
  return balances[userID].balance;
}

// Get user's name
function getUserName(userID) {
  return balances[userID]?.name || 'Unknown';
}

// Set balance (also update name)
function setBalance(userID, amount, userName = 'Unknown') {
  balances[userID] = { name: userName, balance: amount };
  saveBalances();
}

// Add or subtract from balance
function addBalance(userID, amount, userName = 'Unknown') {
  if (!(userID in balances)) {
    balances[userID] = { name: userName, balance: 2000 };
  }
  balances[userID].balance += amount;
  balances[userID].name = userName; // keep name updated
  saveBalances();
}

// Command config
module.exports.config = {
  name: "balance",
  version: "1.1.0",
  role: 0,
  aliases: ["bal", "money", "wallet"],
  description: "Check your current balance along with your name.",
  usage: "balance",
  credits: "Nax",
  cooldown: 3,
};

// Command run
module.exports.run = async function({ api, event }) {
  const { threadID, senderID, senderName } = event;
  const balance = getBalance(senderID, senderName);
  const name = getUserName(senderID);
  return api.sendMessage(`👤 Name: ${name}\n💰 Balance: $${balance}`, threadID);
};

// Export helpers for other games
module.exports.getBalance = getBalance;
module.exports.getUserName = getUserName;
module.exports.setBalance = setBalance;
module.exports.addBalance = addBalance;
module.exports.saveBalances = saveBalances;