const registration = require('./registration.js').registration;

module.exports.config = {
  name: 'collect',
  version: '1.0.0',
  role: 0,
  aliases: ['grab', 'pick'],
  description: 'Collect random money',
  usage: '',
  credits: 'Nax',
  cooldown: 5,
};

module.exports.run = async function({ api, event }) {
  const { threadID, senderID, senderName } = event;

  // Register if not exist
  registration.registerUser(senderID, senderName);

  const collected = Math.floor(Math.random() * 300) + 20;
  registration.addBalance(senderID, collected);

  return api.sendMessage(`👜 You collected ${collected}$!\n👤 Name: ${registration.getName(senderID)}\n💰 Balance: ${registration.getBalance(senderID)}$`, threadID);
};