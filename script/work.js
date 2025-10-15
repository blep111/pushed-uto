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

// Track cooldowns
const cooldowns = {};

module.exports.config = {
  name: "work",
  version: "1.0.0",
  role: 0,
  aliases: ["earn", "collect", "job"],
  description: "Work to earn money to use in the slot machine.",
  usage: "work",
  credits: "Nax",
  cooldown: 60, // 60 seconds cooldown per user
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const now = Date.now();
  if (cooldowns[senderID] && now - cooldowns[senderID] < 60000) {
    const remaining = Math.ceil((60000 - (now - cooldowns[senderID])) / 1000);
    return api.sendMessage(
      `⏳ Please wait ${remaining}s before working again.`,
      threadID,
      messageID
    );
  }

  const currentBalance = getBalance(senderID);

  // Random earning between 100 and 500
  const earnedAmount = Math.floor(Math.random() * 401) + 100;

  setBalance(senderID, currentBalance + earnedAmount);
  cooldowns[senderID] = now;

  return api.sendMessage(
    `💼 You worked hard and earned $${earnedAmount}!\n💰 Your new balance: $${getBalance(senderID)}\nYou can now use this balance in the slot machine!`,
    threadID,
    messageID
  );
};