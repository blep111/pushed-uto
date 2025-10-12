const axios = require("axios");

module.exports.config = {
  name: "weather",
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  aliases: [],
  description: "Get weather by city using Urangkapolka API",
  usage: "weather <city>",
  credits: "You",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (args.length === 0) {
    return api.sendMessage("📌 Usage: weather <city>", threadID, messageID);
  }

  const city = args.join(" ").trim();
  const encoded = encodeURIComponent(city);
  const apiUrl = `https://urangkapolka.vercel.app/api/weather?q=${encoded}`;

  try {
    const resp = await axios.get(apiUrl);
    const data = resp.data;

    // For debugging, log the API response structure
    console.log("Weather API response:", data);

    if (!data || data.error) {
      const errMsg = data?.error || "Unknown error from weather API";
      return api.sendMessage(`❌ Error fetching weather: ${errMsg}`, threadID, messageID);
    }

    // Flexible mapping for different response structures
    // Example API response:
    // {
    //   "location": "Manila",
    //   "weather": "Cloudy",
    //   "description": "Overcast clouds",
    //   "temperature": 30,
    //   "humidity": 73,
    //   "wind": "12 km/h"
    // }
    const location = data.location || data.city || city;
    const weather = data.weather || data.main?.weather || data.condition || "";
    const description = data.description || data.main?.description || "";
    const temperature = data.temperature ?? data.temp ?? data.main?.temp ?? null;
    const humidity = data.humidity ?? data.main?.humidity ?? null;
    const wind = data.wind ?? data.wind_speed ?? data.main?.wind_speed ?? "";

    let msg = `🌤️ Weather in ${location}\n`;
    if (description) msg += `• Condition: ${description}\n`;
    if (temperature != null) msg += `• Temp: ${temperature}°C\n`;
    if (humidity != null) msg += `• Humidity: ${humidity}%\n`;
    if (wind) msg += `• Wind: ${wind}\n`;
    if (weather) msg += `• Weather: ${weather}\n`;

    await api.sendMessage(msg, threadID, messageID);
  } catch (err) {
    console.error("Weather API error:", err);
    return api.sendMessage("❌ Failed to fetch weather. Please try again later.", threadID, messageID);
  }
};