#!/usr/bin/env node
/**
 * Fetch Slack workspace/auth info via auth.test and team.info.
 * Usage: node get-settings.js <slack_token>
 * Node.js 18+
 */

const token = process.argv[2];

if (!token) {
  console.error('Usage: node get-settings.js <SLACK_TOKEN>');
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
    const auth = await get('auth.test');
    console.log('Auth (auth.test):');
    console.log('  URL:', auth.url);
    console.log('  Team:', auth.team, auth.team_id);
    console.log('  User:', auth.user, auth.user_id);

    const team = await get('team.info');
    if (team.team) {
      const t = team.team;
      console.log('Team (team.info):');
      console.log('  Name:', t.name);
      console.log('  Domain:', t.domain);
      console.log('  ID:', t.id);
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
