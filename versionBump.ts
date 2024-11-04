const fs = require('fs');
const path = require('path');

const newVersion = process.argv[2]; // Get version from command line

// Check if the version input is valid
if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error("Please specify a valid version (e.g., npm run version-bump 1.1.1)");
  process.exit(1);
}

// Step 1: Update package.json version
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log(`Updated package.json version to ${newVersion}`);

// Step 2: Update build.gradle versionCode and versionName
const buildGradlePath = path.join(__dirname, 'android/app', 'build.gradle');
let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

// Regular expressions to match versionCode and versionName
const versionCodeRegex = /versionCode\s+(\d+)/;
const versionNameRegex = /versionName\s+"(\d+\.\d+\.\d+)"/;

// Increment versionCode by 1
buildGradle = buildGradle.replace(versionCodeRegex, (match, p1) => `versionCode ${parseInt(p1) + 1}`);

// Set versionName to the new version
console.log('versionNameRegex: ', versionNameRegex);
buildGradle = buildGradle.replace(versionNameRegex, `versionName "${newVersion}"`);

// Write updated content back to build.gradle
fs.writeFileSync(buildGradlePath, buildGradle);
console.log(`Updated build.gradle versionName to ${newVersion}`);
