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

module.exports = {
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