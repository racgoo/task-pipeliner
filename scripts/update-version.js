import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function updateVersion(version) {
  if (!version) {
    console.error('Usage: node update-version.js <version>');
    console.error('Example: node update-version.js 0.2.0');
    process.exit(1);
  }

  // Update package.json
  const packageJsonPath = join(rootDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const oldVersion = packageJson.version;
  packageJson.version = version;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✓ Updated version from ${oldVersion} to ${version} in package.json`);

  // Update README.md (English)
  const readmePath = join(rootDir, 'README.md');
  let readmeContent = fs.readFileSync(readmePath, 'utf-8');
  // Replace version in "**Version:** X.X.X" line
  readmeContent = readmeContent.replace(
    /\*\*Version:\*\* \d+\.\d+\.\d+/,
    `**Version:** ${version}`
  );
  // Replace any other hardcoded version numbers (e.g., "version 0.1.0" -> "version ${version}")
  readmeContent = readmeContent.replace(
    new RegExp(`\\b${oldVersion.replace(/\./g, '\\.')}\\b`, 'g'),
    version
  );
  fs.writeFileSync(readmePath, readmeContent);
  console.log(`✓ Updated version in README.md`);

  // Update README.ko.md (Korean)
  const readmeKoPath = join(rootDir, 'README.ko.md');
  let readmeKoContent = fs.readFileSync(readmeKoPath, 'utf-8');
  // Replace version in "**버전:** X.X.X" line
  readmeKoContent = readmeKoContent.replace(
    /\*\*버전:\*\* \d+\.\d+\.\d+/,
    `**버전:** ${version}`
  );
  // Replace any other hardcoded version numbers
  readmeKoContent = readmeKoContent.replace(
    new RegExp(`\\b${oldVersion.replace(/\./g, '\\.')}\\b`, 'g'),
    version
  );
  fs.writeFileSync(readmeKoPath, readmeKoContent);
  console.log(`✓ Updated version in README.ko.md`);
}

// Get version from command line arguments
const version = process.argv[2];
updateVersion(version);