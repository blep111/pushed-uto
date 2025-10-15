const fs = require('fs-extra');
const path = require('path');
const { createCanvas } = require('canvas');
const registration = require('./registration.js').registration;

module.exports.config = {
  name: "argue",
  version: "1.0.1",
  role: 0,
  aliases: ["battle", "duel", "fight"],
  description: "Fight mini-game. Bet money and fight for rewards!",
  usage: "argue <bet_amount>",
  credits: "Nax",
  cooldown: 5,
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, senderName } = event;

  // Ensure user is registered
  registration.registerUser(senderID, senderName);

  // Parse bet amount
  const bet = parseInt(args[0]);
  if (!bet || bet <= 0) return api.sendMessage("❌ You need to specify a valid bet amount.", threadID, messageID);

  const balance = registration.getBalance(senderID);
  if (bet > balance) return api.sendMessage("❌ You don't have enough balance for that bet.", threadID, messageID);
  if (bet < 50) return api.sendMessage("❌ Minimum bet is $50.", threadID, messageID);

  // Determine fight outcome
  const outcomes = ["win", "lose", "draw"];
  const result = outcomes[Math.floor(Math.random() * outcomes.length)];

  let winAmount = 0;
  if (result === "win") winAmount = bet * 2;
  else if (result === "draw") winAmount = 0;
  else winAmount = -bet;

  // Update balance in registration system
  registration.addBalance(senderID, winAmount);

  // Create canvas
  const canvas = createCanvas(400, 200);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw fight info
  ctx.fillStyle = 'white';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(`Fight Result: ${result.toUpperCase()}`, 20, 40);
  ctx.fillText(`Bet: $${bet}`, 20, 80);
  ctx.fillText(`Balance Change: $${winAmount}`, 20, 120);
  ctx.fillText(`New Balance: $${registration.getBalance(senderID)}`, 20, 160);
  ctx.font = '40px Arial';
  ctx.fillText(result === "win" ? "💪" : result === "lose" ? "💀" : "🤝", 300, 120);

  // Save canvas image temporarily
  const filePath = path.join(__dirname, `fight_${senderID}.png`);
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(filePath, buffer);

  // Send result
  await api.sendMessage(
    { body: `⚔️ Fight finished!\n👤 Player: ${registration.getName(senderID)}\n💰 Balance: ${registration.getBalance(senderID)}$`, attachment: fs.createReadStream(filePath) },
    threadID
  );

  // Cleanup
  await fs.remove(filePath).catch(() => {});
};