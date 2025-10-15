const registration = require('./registration.js').registration;

module.exports.config = {
  name: 'work',
  version: '1.0.0',
  role: 0,
  aliases: ['job', 'earn'],
  description: 'Work to earn money',
  usage: '',
  credits: 'Nax',
  cooldown: 5,
};

module.exports.run = async function({ api, event }) {
  const { threadID, senderID, senderName } = event;

  // Register if not exist
  registration.registerUser(senderID, senderName);

  const earnings = Math.floor(Math.random() * 500) + 50;
  registration.addBalance(senderID, earnings);

  return api.sendMessage(`💼 You worked and earned ${earnings}$!\n👤 Name: ${registration.getName(senderID)}\n💰 Balance: ${registration.getBalance(senderID)}$`, threadID);
};