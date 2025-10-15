const fs = require('fs-extra');
const path = require('path');

const usersFile = path.join(__dirname, 'users.json');
let users = {};

// Load existing users
if (fs.existsSync(usersFile)) {
  try {
    users = fs.readJsonSync(usersFile);
  } catch {
    users = {};
  }
}

// Save users
function saveUsers() {
  fs.writeJsonSync(usersFile, users, { spaces: 2 });
}

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

  if (!name) {
    return api.sendMessage(
      '❌ Please provide your name to register. Example: register John Doe',
      threadID,
      messageID
    );
  }

  // Register or update user
  if (!(senderID in users)) {
    users[senderID] = { name: name, balance: 2000 }; // default balance
    saveUsers();
    return api.sendMessage(
      `✅ Registration successful!\n👤 Name: ${name}\n💰 Starting Balance: 2000$`,
      threadID,
      messageID
    );
  } else {
    users[senderID].name = name; // Update name
    saveUsers();
    return api.sendMessage(
      `✅ Name updated successfully!\n👤 New Name: ${name}\n💰 Current Balance: ${users[senderID].balance}$`,
      threadID,
      messageID
    );
  }
};