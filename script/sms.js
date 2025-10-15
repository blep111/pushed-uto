// sms_personal.js
// Personal-use SMS sender with opt-in and persistence (Twilio).
// Usage (in-chat):
//  sms optin <phone>
//  sms optout <phone>
//  sms send <phone> <message...>
//  sms status <phone>    <-- shows opt-in info

const fs = require('fs-extra');
const path = require('path');
const Twilio = require('twilio');

const DATA_DIR = __dirname;
const OPTINS_FILE = path.join(DATA_DIR, 'sms_optins.json');
const LOG_FILE = path.join(DATA_DIR, 'sms_logs.json');
const USAGE_FILE = path.join(DATA_DIR, 'sms_usage.json');

// Load persisted data
let optins = {};
let logs = [];
let usage = {};
try { if (fs.existsSync(OPTINS_FILE)) optins = fs.readJsonSync(OPTINS_FILE); } catch (e) { optins = {}; }
try { if (fs.existsSync(LOG_FILE)) logs = fs.readJsonSync(LOG_FILE); } catch (e) { logs = []; }
try { if (fs.existsSync(USAGE_FILE)) usage = fs.readJsonSync(USAGE_FILE); } catch (e) { usage = {}; }

function saveOptins(){ fs.writeJsonSync(OPTINS_FILE, optins, { spaces: 2 }); }
function saveLogs(){ fs.writeJsonSync(LOG_FILE, logs, { spaces: 2 }); }
function saveUsage(){ fs.writeJsonSync(USAGE_FILE, usage, { spaces: 2 }); }

// Twilio config — supply via environment
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN  || '';
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || '';
const OWNER_ID = process.env.OWNER_ID || ''; // optional: your bot user ID for personal override

let twilioClient = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

// Helpers
function normalizePhone(phone){
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, ''); // keep digits and + (if present)
}

function ensureUsage(senderID){
  if (!usage[senderID]) usage[senderID] = { lastReset: Date.now(), sentToday: 0 };
  if (Date.now() - usage[senderID].lastReset > 24*60*60*1000){
    usage[senderID].lastReset = Date.now();
    usage[senderID].sentToday = 0;
  }
  saveUsage();
}

function logSend(entry){
  logs.unshift(entry);
  if (logs.length > 500) logs = logs.slice(0, 500);
  saveLogs();
}

// config for limits (tweak for personal use)
const SENDER_DAILY_LIMIT = 100;    // how many messages a sender can send per day
const RECIPIENT_DAILY_LIMIT = 10;  // how many messages a recipient can receive per day

module.exports.config = {
  name: 'sms',
  version: '1.0.0',
  role: 0,
  aliases: ['smsmsg','texts'],
  description: 'Personal SMS sender (opt-in required).',
  usage: 'sms optin <phone> | sms optout <phone> | sms send <phone> <message>',
  credits: 'Nax',
  cooldown: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, senderName } = event;
  const sub = (args[0] || '').toLowerCase();

  // help / usage
  if (!sub || !['optin','optout','send','status'].includes(sub)) {
    return api.sendMessage(
`Usage:
• sms optin <phone> — recipient opts in (must be done by recipient or with consent)
• sms optout <phone> — recipient opts out
• sms send <phone> <message> — send one SMS to an opted-in phone (owner can bypass opt-in if OWNER_ID set)
• sms status <phone> — show opt-in info`,
      threadID, messageID
    );
  }

  // ---------- OPTIN ----------
  if (sub === 'optin') {
    const phoneRaw = args[1];
    if (!phoneRaw) return api.sendMessage('❌ Usage: sms optin <phone>', threadID, messageID);
    const phone = normalizePhone(phoneRaw);
    optins[phone] = { phone, registeredBy: senderID, registeredName: senderName || `User_${senderID}`, timestamp: Date.now() };
    saveOptins();
    return api.sendMessage(`✅ ${phone} is now opted-in to receive messages.`, threadID, messageID);
  }

  // ---------- OPTOUT ----------
  if (sub === 'optout') {
    const phoneRaw = args[1];
    if (!phoneRaw) return api.sendMessage('❌ Usage: sms optout <phone>', threadID, messageID);
    const phone = normalizePhone(phoneRaw);
    if (optins[phone]) {
      delete optins[phone];
      saveOptins();
      return api.sendMessage(`✅ ${phone} has been opted out and will no longer receive messages.`, threadID, messageID);
    } else {
      return api.sendMessage(`⚠️ ${phone} is not opted-in.`, threadID, messageID);
    }
  }

  // ---------- STATUS ----------
  if (sub === 'status') {
    const phoneRaw = args[1];
    if (!phoneRaw) return api.sendMessage('❌ Usage: sms status <phone>', threadID, messageID);
    const phone = normalizePhone(phoneRaw);
    const r = optins[phone];
    if (!r) return api.sendMessage(`⚠️ ${phone} is not opted-in.`, threadID, messageID);
    const d = new Date(r.timestamp);
    return api.sendMessage(`✅ Opted-in: ${phone}\nRegistered by: ${r.registeredName} (${r.registeredBy})\nAt: ${d.toLocaleString()}`, threadID, messageID);
  }

  // ---------- SEND ----------
  if (sub === 'send') {
    if (!twilioClient) return api.sendMessage('❌ Twilio not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.', threadID, messageID);
    const phoneRaw = args[1];
    if (!phoneRaw) return api.sendMessage('❌ Usage: sms send <phone> <message>', threadID, messageID);
    const phone = normalizePhone(phoneRaw);
    const messageText = args.slice(2).join(' ').trim();
    if (!messageText) return api.sendMessage('❌ Please provide the message text.', threadID, messageID);

    const isOwner = OWNER_ID && String(OWNER_ID) === String(senderID);

    // Check opt-in unless owner override
    if (!optins[phone] && !isOwner) {
      return api.sendMessage(`❌ Cannot send: ${phone} is not opted-in. Ask recipient to run: sms optin ${phone}`, threadID, messageID);
    }

    // Rate limiting
    ensureUsage(senderID);
    if (usage[senderID].sentToday >= SENDER_DAILY_LIMIT && !isOwner) {
      return api.sendMessage(`⛔ You have reached your daily limit (${SENDER_DAILY_LIMIT}).`, threadID, messageID);
    }

    const todayKey = (new Date()).toISOString().slice(0,10);
    const sentToRecipientToday = logs.filter(l => l.to === phone && l.date && l.date.slice(0,10) === todayKey).length;
    if (sentToRecipientToday >= RECIPIENT_DAILY_LIMIT && !isOwner) {
      return api.sendMessage(`⛔ Recipient ${phone} has reached daily receive limit (${RECIPIENT_DAILY_LIMIT}).`, threadID, messageID);
    }

    // Send via Twilio
    try {
      const twRes = await twilioClient.messages.create({
        body: messageText,
        from: TWILIO_FROM_NUMBER,
        to: phone
      });

      // log + usage
      ensureUsage(senderID);
      usage[senderID].sentToday += 1;
      saveUsage();

      logSend({
        date: new Date().toISOString(),
        fromSender: senderID,
        fromName: senderName || `User_${senderID}`,
        to: phone,
        sid: twRes.sid || null,
        status: twRes.status || 'sent',
        text: messageText.slice(0,500)
      });

      return api.sendMessage(`✅ Message sent to ${phone}. SID: ${twRes.sid || 'n/a'}`, threadID, messageID);
    } catch (err) {
      console.error('Twilio error', err);
      return api.sendMessage(`❌ Failed to send SMS: ${err.message || err}`, threadID, messageID);
    }
  }

}; // end run