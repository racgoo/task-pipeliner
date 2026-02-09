#!/usr/bin/env node
/**
 * Send a message to Discord via Webhook.
 * Usage:
 *   node send-discord.js <webhook_url> <message>   (args only)
 *   node send-discord.js "Your message"             (URL from DISCORD_WEBHOOK_URL env)
 * Node.js 18+ (uses built-in fetch).
 */

const url = process.argv[2] && process.argv[3] ? process.argv[2] : process.env.DISCORD_WEBHOOK_URL;
const message = process.argv[2] && process.argv[3] ? process.argv[3] : (process.argv[2] || 'No message provided');

if (!url) {
  console.error('Error: Pass webhook URL and message as args: node send-discord.js <url> <message>');
  process.exit(1);
}

(async () => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });
    if (!res.ok) {
      console.error('Discord API error:', res.status, await res.text());
      process.exit(1);
    }
  } catch (err) {
    console.error('Failed to send to Discord:', err.message);
    process.exit(1);
  }
})();
