const registration = require('./registration.js').registration;

module.exports.config = {
  name: 'fight',
  version: '1.0.0',
  role: 0,
  aliases: ['battle', 'duel'],
  description: 'Fight another user to win or lose money',
  usage: '@mention | <bet>',
  credits: 'Nax',
  cooldown: 5,
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, mentions, senderID, senderName } = event;

  // Check if user mentioned someone
  if (!mentions || Object.keys(mentions).length === 0) {
    return api.sendMessage('❌ Please mention a user to fight with.', threadID, messageID);
  }

  const targetID = Object.keys(mentions)[0];
  const bet = parseInt(args[1] || args[0]);
  if (isNaN(bet) || bet <= 0) return api.sendMessage('❌ Please enter a valid bet amount.', threadID, messageID);

  // Register both players
  registration.registerUser(senderID, senderName);
  registration.registerUser(targetID, 'Opponent');

  const userBalance = registration.getBalance(senderID);
  const targetBalance = registration.getBalance(targetID);

  if (bet > userBalance) return api.sendMessage('❌ You do not have enough money to bet.', threadID, messageID);
  if (bet > targetBalance) return api.sendMessage('❌ Opponent does not have enough money to fight.', threadID, messageID);

  // Determine winner randomly
  const winner = Math.random() < 0.5 ? senderID : targetID;
  const loser = winner === senderID ? targetID : senderID;

  // Transfer money
  registration.addBalance(winner, bet);
  registration.addBalance(loser, -bet);

  return api.sendMessage(
    `⚔️ Fight Result!\n👤 ${registration.getName(winner)} won the fight and gained ${bet}$\n👤 ${registration.getName(loser)} lost ${bet}$\n\n💰 ${registration.getName(senderID)}'s balance: ${registration.getBalance(senderID)}$\n💰 ${registration.getName(targetID)}'s balance: ${registration.getBalance(targetID)}$`,
    threadID
  );
};