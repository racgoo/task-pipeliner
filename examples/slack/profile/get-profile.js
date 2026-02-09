#!/usr/bin/env node
/**
 * Fetch Slack user profile via users.info (or auth.test if no user id).
 * Usage: node get-profile.js <slack_token> [user_id]
 *   user_id optional; if omitted, calls auth.test and prints current auth user.
 * Node.js 18+
 */

const token = process.argv[2];
const userId = process.argv[3];

if (!token) {
  console.error('Usage: node get-profile.js <SLACK_TOKEN> [user_id]');
  process.exit(1);
}

const SLACK_API = 'https://slack.com/api';

async function get(path, qs = {}) {
  const url = new URL(path, SLACK_API);
  Object.entries(qs).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.ok) {
    console.error('Slack API error:', data.error || res.status);
    process.exit(1);
  }
  return data;
}

(async () => {
  try {
    if (!userId || userId === '' || userId === 'me') {
      const auth = await get('auth.test');
      console.log('Current user:', auth.user_id, auth.user);
      if (auth.team) console.log('Team:', auth.team);
      return;
    }
    const data = await get('users.info', { user: userId });
    const u = data.user;
    const p = u.profile || {};
    console.log('User:', u.id);
    console.log('Real name:', p.real_name || u.real_name || '-');
    console.log('Display name:', p.display_name || '-');
    if (p.email) console.log('Email:', p.email);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
