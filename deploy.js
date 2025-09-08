const fs = require('fs');
const { execSync } = require('child_process');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Increment patch version
const versionParts = packageJson.version.split('.');
versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
packageJson.version = versionParts.join('.');

// Write back to package.json
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

console.log(`Version updated to ${packageJson.version}`);

// Build the project
console.log('Building project...');
execSync('npm run build', { stdio: 'inherit' });

// Add, commit, and push changes
console.log('Committing and pushing changes...');
execSync('git add .', { stdio: 'inherit' });
execSync(`git commit -m "Deploy version ${packageJson.version}"`, { stdio: 'inherit' });
execSync('git push', { stdio: 'inherit' });

console.log('Deployment complete!');
