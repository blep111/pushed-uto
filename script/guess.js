const fs = require('fs-extra');
const path = require('path');
const { createCanvas } = require('canvas');
const registration = require('./registration.js').registration;

module.exports.config = {
  name: "guess",
  version: "1.0.0",
  role: 0,
  aliases: ["guessnumber", "numbergame"],
  description: "Number guessing game. Bet money and guess a number between 1-10!",
  usage: "guess <bet_amount> <your_guess>",
  credits: "Nax",
  cooldown: 5,
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, senderName } = event;

  // Register user if not already
  registration.registerUser(senderID, senderName);

  // Parse bet and guess
  const bet = parseInt(args[0]);
  const guess = parseInt(args[1]);

  if (!bet || bet <= 0) return api.sendMessage("❌ Please enter a valid bet amount.", threadID, messageID);
  if (!guess || guess < 1 || guess > 10) return api.sendMessage("❌ Guess must be a number between 1 and 10.", threadID, messageID);

  const balance = registration.getBalance(senderID);
  if (bet > balance) return api.sendMessage("❌ You don't have enough balance for that bet.", threadID, messageID);
  if (bet < 50) return api.sendMessage("❌ Minimum bet is $50.", threadID, messageID);

  // Generate random number between 1-10
  const targetNumber = Math.floor(Math.random() * 10) + 1;

  let resultText = '';
  let winAmount = 0;

  if (guess === targetNumber) {
    winAmount = bet * 2;
    resultText = `🎉 Correct! You guessed ${guess} and won $${winAmount}!`;
  } else {
    winAmount = -bet;
    resultText = `❌ Wrong! You guessed ${guess}, the correct number was ${targetNumber}. You lost $${bet}.`;
  }

  // Update user balance
  registration.addBalance(senderID, winAmount);

  // Create canvas
  const canvas = createCanvas(500, 250);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 22px Arial';
  ctx.fillText(`Guess Number Game`, 20, 40);
  ctx.fillText(`Player: ${registration.getName(senderID)}`, 20, 80);
  ctx.fillText(`Your Guess: ${guess}`, 20, 120);
  ctx.fillText(`Result: ${winAmount >= 0 ? '🎉 Win!' : '💀 Lose!'}`, 20, 160);
  ctx.fillText(`Balance Change: $${winAmount}`, 20, 200);
  ctx.fillText(`New Balance: $${registration.getBalance(senderID)}`, 20, 240);

  // Save canvas
  const filePath = path.join(__dirname, `guess_${senderID}.png`);
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(filePath, buffer);

  // Send result
  await api.sendMessage(
    { body: resultText, attachment: fs.createReadStream(filePath) },
    threadID
  );

  // Cleanup
  await fs.remove(filePath).catch(() => {});
};