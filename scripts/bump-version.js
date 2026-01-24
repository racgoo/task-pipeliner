import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Read current version from package.json
const packageJsonPath = join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const currentVersion = packageJson.version;

// Parse version (e.g., "0.1.0" -> [0, 1, 0])
const versionParts = currentVersion.split('.').map(Number);
const major = versionParts[0];
const minor = versionParts[1];
const patch = versionParts[2];

// Increment patch version
const newVersion = `${major}.${minor}.${patch + 1}`;

console.log(`Bumping version from ${currentVersion} to ${newVersion}`);

// Update version using the existing update-version script
import { execSync } from 'child_process';
execSync(`pnpm exec node scripts/update-version.js ${newVersion}`, { stdio: 'inherit' });

