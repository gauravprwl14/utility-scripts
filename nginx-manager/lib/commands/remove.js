// Command: nginx-manager remove <app-name>
// Deletes the managed config file for the given app.

const path = require('path');
const { getConfig } = require('../../config');
const { validateName } = require('../utils/validate');
const { fileExists, deleteFile } = require('../utils/file');
const { parseConfigFile } = require('../nginx/config-parser');

function remove(parsed) {
  const { appName } = parsed;

  if (!appName) {
    console.error('Error: app-name is required');
    console.error('Usage: nginx-manager remove <app-name>');
    process.exit(1);
  }

  const nameError = validateName(appName);
  if (nameError) { console.error('Error:', nameError); process.exit(1); }

  const config = getConfig();
  const filePath = path.join(config.appsDir, `${config.prefix}-${appName}.conf`);

  if (!fileExists(filePath)) {
    console.error(`Error: No config found for "${appName}" (${filePath})`);
    process.exit(1);
  }

  // Confirm it's a managed config before deleting
  const meta = parseConfigFile(filePath);
  if (!meta) {
    console.error(`Error: "${filePath}" does not appear to be a managed config.`);
    console.error('Remove it manually if you are sure.');
    process.exit(1);
  }

  deleteFile(filePath);
  console.log(`Removed: ${filePath}`);
  console.log('');
  console.log('Run "sudo nginx-manager reload" to apply changes.');
}

module.exports = remove;
