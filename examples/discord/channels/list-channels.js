#!/usr/bin/env node
/**
 * List channels in a Discord guild via the Discord API.
 * Usage: node list-channels.js <bot_token> <guild_id>
 * Node.js 18+
 * Requires bot to be in the guild. Token from Developer Portal → Bot.
 */

const token = process.argv[2];
const guildId = process.argv[3];

if (!token || !guildId) {
  console.error('Usage: node list-channels.js <DISCORD_TOKEN> <GUILD_ID>');
  process.exit(1);
}

const DISCORD_API = 'https://discord.com/api/v10';

(async () => {
  try {
    const res = await fetch(`${DISCORD_API}/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('Discord API error:', res.status, text);
      process.exit(1);
    }
    const channels = await res.json();
    const typeNames = { 0: 'text', 2: 'voice', 4: 'category', 5: 'announcement', 13: 'stage', 15: 'forum' };
    console.log('Channels:');
    console.log('  ID                  Type     Name');
    console.log('  ' + '─'.repeat(50));
    for (const ch of channels) {
      const typeStr = (typeNames[ch.type] != null ? typeNames[ch.type] : ch.type).padEnd(8);
      const name = (ch.name || '').slice(0, 24);
      console.log('  ' + ch.id + '  ' + typeStr + '  ' + name);
    }
    console.log('  Total:', channels.length);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
