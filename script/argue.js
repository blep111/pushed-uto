const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const balancesFile = path.join(__dirname, 'balances.json');

// Load balances from file or initialize empty
let balances = {};
if (fs.existsSync(balancesFile)) {
  try {
    balances = fs.readJsonSync(balancesFile);
  } catch {
    balances = {};
  }
}

// Helper functions
function saveBalances() {
  fs.writeJsonSync(balancesFile, balances, { spaces: 2 });
}

function getBalance(userID) {
  if (!(userID in balances)) balances[userID] = 2000; // Default starting cash
  return balances[userID];
}

function setBalance(userID, amount) {
  balances[userID] = amount;
  saveBalances();
}

module.exports.config = {
  name: "argue",
  version: "1.0.0",
  role: 0,
  aliases: ["battle", "duel"],
  description: "Fight mini-game. Bet money and fight for rewards!",
  usage: "fight <bet_amount>",
  credits: "Nax",
  cooldown: 5,
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const bet = parseInt(args[0]);
  if (!bet || bet <= 0) return api.sendMessage("❌ You need to specify a valid bet amount.", threadID, messageID);

  const balance = getBalance(senderID);
  if (bet > balance) return api.sendMessage("❌ You don't have enough balance for that bet.", threadID, messageID);
  if (bet < 50) return api.sendMessage("❌ Minimum bet is $50.", threadID, messageID);

  // Create fight outcome
  const outcomes = ["win", "lose", "draw"];
  const result = outcomes[Math.floor(Math.random() * outcomes.length)];

  let winAmount = 0;
  if (result === "win") winAmount = bet * 2;
  else if (result === "draw") winAmount = 0;
  else winAmount = -bet;

  setBalance(senderID, balance + winAmount);

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
  ctx.fillText(`New Balance: $${getBalance(senderID)}`, 20, 160);

  // Optionally, you can add emojis or images for more flair
  ctx.font = '40px Arial';
  ctx.fillText(result === "win" ? "💪" : result === "lose" ? "💀" : "🤝", 300, 120);

  // Save canvas image temporarily
  const filePath = path.join(__dirname, `fight_${senderID}.png`);
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(filePath, buffer);

  // Send the result
  await api.sendMessage(
    { body: `⚔️ Fight finished!`, attachment: fs.createReadStream(filePath) },
    threadID
  );

  // Cleanup
  await fs.remove(filePath).catch(() => {});
};