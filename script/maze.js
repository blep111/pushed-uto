const balanceManager = require('./balance.js');

module.exports.config = {
  name: "maze",
  version: "1.0.1",
  role: 0,
  aliases: ["mazegame", "guessmaze"],
  description: "Maze guessing game. Enter your moves and win money!",
  usage: "maze <sequence of moves: up, down, left, right>",
  credits: "Nax",
  cooldown: 5,
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, senderName } = event;

  let balance = balanceManager.getBalance(senderID, senderName);
  const betAmount = 100; // cost to play

  if (balance < betAmount) {
    return api.sendMessage(`❌ You need at least $${betAmount} to play. Your balance: $${balance}`, threadID);
  }

  if (!args || args.length === 0) {
    return api.sendMessage(`⚠️ Please provide your moves as a sequence, e.g.:\nmaze right down down right`, threadID);
  }

  // Deduct the bet
  balanceManager.addBalance(senderID, -betAmount, senderName);

  // Maze setup
  const mazeSize = 3;
  const treasure = { x: 2, y: 2 };
  let position = { x: 0, y: 0 };

  const moves = args.map(m => m.toLowerCase());
  const maxSteps = 5;
  let stepsTaken = 0;

  for (let move of moves) {
    if (stepsTaken >= maxSteps) break;
    if (move === "up" && position.y > 0) position.y--;
    else if (move === "down" && position.y < mazeSize - 1) position.y++;
    else if (move === "left" && position.x > 0) position.x--;
    else if (move === "right" && position.x < mazeSize - 1) position.x++;
    stepsTaken++;
  }

  let message = "";
  if (position.x === treasure.x && position.y === treasure.y) {
    const reward = 300;
    balanceManager.addBalance(senderID, reward, senderName);
    message = `🎉 You reached the treasure in ${stepsTaken} moves and won $${reward}!\n💰 Your new balance: $${balanceManager.getBalance(senderID)}`;
  } else {
    message = `❌ You did not reach the treasure in ${stepsTaken} moves.\n💰 Your balance: $${balanceManager.getBalance(senderID)}`;
  }

  return api.sendMessage(message, threadID);
};