const fs = require('fs-extra');
const path = require('path');

const usersFile = path.join(__dirname, 'users.json');
let users = {};

// Load existing users
if (fs.existsSync(usersFile)) {
  try { users = fs.readJsonSync(usersFile); } catch { users = {}; }
}

// Save users
function saveUsers() {
  fs.writeJsonSync(usersFile, users, { spaces: 2 });
}

const registration = {
  registerUser: (userID, userName) => {
    if (!(userID in users)) {
      users[userID] = { name: userName, balance: 2000 }; // default starting balance
      saveUsers();
    }
  },
  updateName: (userID, newName) => {
    if (userID in users) {
      users[userID].name = newName;
      saveUsers();
    }
  },
  getUser: (userID) => users[userID],
  getBalance: (userID) => users[userID]?.balance || 0,
  addBalance: (userID, amount) => {
    if (!(userID in users)) return;
    users[userID].balance += amount;
    saveUsers();
  },
  setBalance: (userID, amount) => {
    if (!(userID in users)) return;
    users[userID].balance = amount;
    saveUsers();
  },
  getName: (userID) => users[userID]?.name || "Unknown"
};

module.exports.config = {
  name: 'register',
  version: '1.0.0',
  role: 0,
  aliases: ['signup', 'reg'],
  description: 'Register yourself and set your name permanently',
  usage: '<name>',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const name = args.join(' ').trim();

  if (!name) return api.sendMessage('❌ Please provide your name to register.', threadID, messageID);

  if (!(senderID in users)) {
    registration.registerUser(senderID, name);
    return api.sendMessage(`✅ Registered!\n👤 Name: ${name}\n💰 Balance: 2000$`, threadID, messageID);
  } else {
    registration.updateName(senderID, name);
    return api.sendMessage(`✅ Name updated!\n👤 Name: ${name}\n💰 Balance: ${registration.getBalance(senderID)}$`, threadID, messageID);
  }
};

module.exports.registration = registration;