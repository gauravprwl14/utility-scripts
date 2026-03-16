// Command: nginx-manager add <app-name> <port> [options]
// Creates a new managed nginx route config file.

const path = require('path');
const { getConfig } = require('../../config');
const { validateName, validatePort, validatePath, validateAuth } = require('../utils/validate');
const { fileExists, writeConfigFile } = require('../utils/file');
const { generateConfig } = require('../nginx/config-generator');

function add(parsed) {
  const { appName, port: portArg, options } = parsed;

  // --- Require positional args ---
  if (!appName) {
    console.error('Error: app-name is required');
    console.error('Usage: nginx-manager add <app-name> <port> [options]');
    process.exit(1);
  }
  if (!portArg) {
    console.error('Error: port is required');
    console.error('Usage: nginx-manager add <app-name> <port> [options]');
    process.exit(1);
  }

  // --- Validate ---
  const nameError = validateName(appName);
  if (nameError) { console.error('Error:', nameError); process.exit(1); }

  const portError = validatePort(portArg);
  if (portError) { console.error('Error:', portError); process.exit(1); }

  const urlPath = options.path || `/${appName}`;
  const pathError = validatePath(urlPath);
  if (pathError) { console.error('Error:', pathError); process.exit(1); }

  const auth = options.auth || null;
  const authError = validateAuth(auth);
  if (authError) { console.error('Error:', authError); process.exit(1); }

  // --- Config ---
  const config = getConfig();
  const filePath = path.join(config.appsDir, `${config.prefix}-${appName}.conf`);

  if (fileExists(filePath)) {
    console.error(`Error: Config already exists: ${filePath}`);
    console.error('Use "edit" command to modify it.');
    process.exit(1);
  }

  // --- Generate and write ---
  const params = {
    name:      appName,
    port:      parseInt(portArg, 10),
    path:      urlPath,
    auth,
    websocket: options.websocket || false,
    exact:     options.exact || false,
    domain:    config.domain,
  };

  const content = generateConfig(params, config);
  writeConfigFile(filePath, content);

  console.log(`Created: ${filePath}`);
  console.log(`Route:   https://${config.domain}${urlPath}  →  localhost:${portArg}`);
  if (auth)              console.log(`Auth:    ${auth}`);
  if (options.websocket) console.log(`WebSocket support enabled`);
  if (options.exact)     console.log(`Exact match: location = ${urlPath}`);
  console.log('');
  console.log('Run "sudo nginx-manager reload" to apply changes.');
}

module.exports = add;
