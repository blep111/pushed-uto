const balanceManager = require('./balance.js');
const readline = require('readline'); // optional if using console, for chat use event args

module.exports.config = {
  name: "maze",
  version: "1.0.0",
  role: 0,
  aliases: ["mazegame", "guessmaze"],
  description: "Maze guessing game. Navigate the maze to win money!",
  usage: "maze",
  credits: "Nax",
  cooldown: 5,
};

module.exports.run = async function({ api, event }) {
  const { threadID, senderID, senderName } = event;
  let balance = balanceManager.getBalance(senderID, senderName);

  // Maze setup (simple 3x3 grid)
  const maze = [
    ["start", "", ""],
    ["", "", ""],
    ["", "", "treasure"]
  ];
  let position = { x: 0, y: 0 };
  const maxSteps = 5; // user has 5 moves to find treasure
  const betAmount = 100; // cost to play

  if (balance < betAmount) {
    return api.sendMessage(`❌ You need at least $${betAmount} to play the maze game. Your balance: $${balance}`, threadID);
  }

  balanceManager.addBalance(senderID, -betAmount, senderName); // subtract bet

  let message = `🌀 Maze Game Started!\nYou are at start. Find the treasure in ${maxSteps} moves.\nMove using: up, down, left, right`;
  await api.sendMessage(message, threadID);

  let steps = 0;
  let won = false;

  const handleMove = async (move) => {
    move = move.toLowerCase();
    if (move === "up" && position.y > 0) position.y--;
    else if (move === "down" && position.y < 2) position.y++;
    else if (move === "left" && position.x > 0) position.x--;
    else if (move === "right" && position.x < 2) position.x++;
    else return api.sendMessage("⚠️ Invalid move or hit wall!", threadID);

    steps++;
    if (maze[position.y][position.x] === "treasure") {
      won = true;
      const reward = 300; // winning amount
      balanceManager.addBalance(senderID, reward, senderName);
      return api.sendMessage(`🎉 Congratulations! You found the treasure and won $${reward}!\n💰 Your new balance: $${balanceManager.getBalance(senderID)}`, threadID);
    }

    if (steps >= maxSteps) {
      return api.sendMessage(`❌ You did not find the treasure in ${maxSteps} moves. Better luck next time!\n💰 Your balance: $${balanceManager.getBalance(senderID)}`, threadID);
    }

    // Otherwise, continue game
    await api.sendMessage(`Step ${steps}/${maxSteps} completed. Your current position: (${position.x},${position.y})`, threadID);
  };

  // Here we simulate moves through messages; in your bot you need to capture next message
  // Example: if user replies with "up", call handleMove("up")
  // You need to hook this with your message event system for interactivity
};