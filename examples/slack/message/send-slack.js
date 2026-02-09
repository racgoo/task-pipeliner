#!/usr/bin/env node
/**
 * Send a message to Slack via Incoming Webhook.
 * Usage:
 *   node send-slack.js <webhook_url> <message>   (args only)
 *   node send-slack.js "Your message"             (URL from SLACK_WEBHOOK_URL env)
 * Node.js 18+ (uses built-in fetch).
 */

const url = process.argv[2] && process.argv[3] ? process.argv[2] : process.env.SLACK_WEBHOOK_URL;
const message = process.argv[2] && process.argv[3] ? process.argv[3] : (process.argv[2] || 'No message provided');

if (!url) {
  console.error('Error: Pass webhook URL and message as args: node send-slack.js <url> <message>');
  process.exit(1);
}

(async () => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
    if (!res.ok) {
      console.error('Slack API error:', res.status, await res.text());
      process.exit(1);
    }
  } catch (err) {
    console.error('Failed to send to Slack:', err.message);
    process.exit(1);
  }
})();
