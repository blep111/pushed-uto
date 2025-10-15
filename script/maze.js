const registration = require('./registration.js').registration;

module.exports.config = {
  name: 'maze',
  version: '1.0.0',
  role: 0,
  aliases: ['guessmaze', 'labyrinth'],
  description: 'Guess the correct path in the maze to win money',
  usage: '<path>',
  credits: 'Nax',
  cooldown: 5,
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, senderName } = event;

  // Register user
  registration.registerUser(senderID, senderName);

  if (!args[0]) return api.sendMessage('❌ Please provide your path guess (A, B, or C).', threadID);

  const guess = args[0].toUpperCase();
  const correctPath = ['A', 'B', 'C'][Math.floor(Math.random() * 3)];
  const reward = Math.floor(Math.random() * 500) + 50;

  if (guess === correctPath) {
    registration.addBalance(senderID, reward);
    return api.sendMessage(
      `🧩 Correct! You found the right path: ${correctPath} ✅\n💰 You earned ${reward}$\n👤 Name: ${registration.getName(senderID)}\n💰 Balance: ${registration.getBalance(senderID)}$`,
      threadID
    );
  } else {
    registration.addBalance(senderID, -reward);
    return api.sendMessage(
      `❌ Wrong path! The correct path was ${correctPath}.\n💰 You lost ${reward}$\n👤 Name: ${registration.getName(senderID)}\n💰 Balance: ${registration.getBalance(senderID)}$`,
      threadID
    );
  }
};