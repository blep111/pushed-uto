const axios = require("axios"); // Keep structure consistent with your other modules

module.exports.config = {
    name: "gio",
    version: "1.0.0",
    role: 0,
    description: "Responds when user says hello gio",
    prefix: false,
    premium: false,
    credits: "Gab",
    cooldowns: 3,
    category: "general"
};

module.exports.run = async function ({ api, event, args }) {
    try {
        // Get user message text
        const message = (event.body || "").toLowerCase();

        // If the message contains "hello gio"
        if (message.includes("hello gio")) {
            return api.sendMessage(" Hi Gab patingin nga kung binata na 🥵", event.threadID, event.messageID);
        }

        // Optional: reply to any mention of gio
        if (message.includes("gio")) {
            return api.sendMessage("Hello Master 👑", event.threadID, event.messageID);
        }

    } catch (error) {
        console.error("Error in gio command:", error.message);
        api.sendMessage("⚠️ Something went wrong with the 'gio' command.", event.threadID, event.messageID);
    }
};