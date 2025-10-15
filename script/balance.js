const registration = require('./registration.js').registration;

module.exports.config = {
  name: 'balance',
  version: '1.0.0',
  role: 0,
  aliases: ['bal', 'money'],
  description: 'Show your balance and name',
  usage: '',
  credits: 'Nax',
  cooldown: 3,
};

module.exports.run = async function({ api, event }) {
  const { threadID, senderID, senderName } = event;

  // Register if not exist
  registration.registerUser(senderID, senderName);

  const name = registration.getName(senderID);
  const balance = registration.getBalance(senderID);

  return api.sendMessage(`👤 Name: ${name}\n💰 Balance: ${balance}$`, threadID);
};