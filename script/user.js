const fs = require('fs-extra');
const path = require('path');

const usersFile = path.join(__dirname, 'users.json');

// Load users from file or initialize empty
let users = {};
if (fs.existsSync(usersFile)) {
  try {
    users = fs.readJsonSync(usersFile);
  } catch {
    users = {};
  }
}

// Save users to file
function saveUsers() {
  fs.writeJsonSync(usersFile, users, { spaces: 2 });
}

module.exports.config = {
  name: "user",
  version: "1.0.0",
  role: 0,
  aliases: ["balance", "register", "userinfo"],
  description: "Manage user registration and balances for all games",
  usage: "register <name> | balance",
  credits: "Nax",
  cooldown: 3
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const command = args[0]?.toLowerCase();

  if (command === "register") {
    const userName = args.slice(1).join(" ") || `User_${senderID}`;
    if (!(senderID in users)) {
      users[senderID] = { name: userName, balance: 2000 };
      saveUsers();
      return api.sendMessage(`✅ Registered as: ${userName}\n💰 Balance: $2000`, threadID, messageID);
    } else {
      return api.sendMessage(`⚠️ Already registered as: ${users[senderID].name}`, threadID, messageID);
    }
  }

  if (command === "balance") {
    if (!(senderID in users)) {
      return api.sendMessage(`❌ Not registered yet. Use "register <name>" first.`, threadID, messageID);
    }
    const { name, balance } = users[senderID];
    return api.sendMessage(`👤 Name: ${name}\n💰 Balance: $${balance}`, threadID, messageID);
  }

  // Instructions
  return api.sendMessage(`📝 Usage:\n- register <name>: Register your account\n- balance: Show your balance`, threadID, messageID);
};

// --- Helper functions for all games ---
module.exports.helpers = {
  isRegistered: (userID) => userID in users,
  registerUser: (userID, name) => {
    if (!(userID in users)) {
      users[userID] = { name: name || `User_${userID}`, balance: 2000 };
      saveUsers();
    }
  },
  getBalance: (userID) => (userID in users ? users[userID].balance : 0),
  addBalance: (userID, amount) => {
    if (userID in users) {
      users[userID].balance += amount;
      saveUsers();
    }
  },
  setBalance: (userID, amount) => {
    if (userID in users) {
      users[userID].balance = amount;
      saveUsers();
    }
  },
  getName: (userID) => (userID in users ? users[userID].name : `User_${userID}`),
  getAllUsers: () => users
};