const fs = require('fs-extra');
const path = require('path');

const usersFile = path.join(__dirname, 'users.json');
let users = {};

// Load existing users or initialize empty
if (fs.existsSync(usersFile)) {
  try { users = fs.readJsonSync(usersFile); } 
  catch { users = {}; }
}

// Save users to JSON
function saveUsers() {
  fs.writeJsonSync(usersFile, users, { spaces: 2 });
}

module.exports = {
  // Register user by ID and name
  registerUser: (userID, userName) => {
    if (!(userID in users)) {
      users[userID] = { name: userName, balance: 2000 }; // default starting balance
      saveUsers();
    }
  },

  // Update user name (in case it changes)
  updateName: (userID, newName) => {
    if (userID in users) {
      users[userID].name = newName;
      saveUsers();
    }
  },

  // Get user info
  getUser: (userID) => users[userID],

  // Get balance
  getBalance: (userID) => users[userID]?.balance || 0,

  // Add balance
  addBalance: (userID, amount) => {
    if (!(userID in users)) return;
    users[userID].balance += amount;
    saveUsers();
  },

  // Set balance
  setBalance: (userID, amount) => {
    if (!(userID in users)) return;
    users[userID].balance = amount;
    saveUsers();
  },

  // Get name
  getName: (userID) => users[userID]?.name || "Unknown"
};