// Command: nginx-manager edit <app-name> [options]
// Reads the existing config, merges CLI options, regenerates the file.
//
// Supported options:
//   --path /new-path    Change URL path
//   --auth basic|ip|token   Change auth type
//   --no-auth           Remove auth
//   --websocket         Enable WebSocket
//   --no-websocket      Disable WebSocket
//   --exact             Enable exact match
//   --port <new-port>   Change local port

const path = require('path');
const { getConfig } = require('../../config');
const { validateName, validatePort, validatePath, validateAuth } = require('../utils/validate');
const { fileExists, writeConfigFile } = require('../utils/file');
const { parseConfigFile } = require('../nginx/config-parser');
const { generateConfig } = require('../nginx/config-generator');

function edit(parsed) {
  const { appName, options } = parsed;

  if (!appName) {
    console.error('Error: app-name is required');
    console.error('Usage: nginx-manager edit <app-name> [options]');
    process.exit(1);
  }

  const nameError = validateName(appName);
  if (nameError) { console.error('Error:', nameError); process.exit(1); }

  const config = getConfig();
  const filePath = path.join(config.appsDir, `${config.prefix}-${appName}.conf`);

  if (!fileExists(filePath)) {
    console.error(`Error: No config found for "${appName}" (${filePath})`);
    console.error('Use "add" command to create it first.');
    process.exit(1);
  }

  const existing = parseConfigFile(filePath);
  if (!existing) {
    console.error(`Error: "${filePath}" does not appear to be a managed config.`);
    process.exit(1);
  }

  // --- Merge existing metadata with new options ---

  // Port: --port option overrides existing
  let port = existing.port;
  if (options.port !== null && options.port !== undefined) {
    const portError = validatePort(options.port);
    if (portError) { console.error('Error:', portError); process.exit(1); }
    port = parseInt(options.port, 10);
  }

  // Path: --path option overrides existing
  let urlPath = existing.path;
  if (options.path) {
    const pathError = validatePath(options.path);
    if (pathError) { console.error('Error:', pathError); process.exit(1); }
    urlPath = options.path;
  }

  // Auth: --no-auth removes it; --auth <type> sets it; otherwise keep existing
  let auth = existing.auth;
  if (options.noAuth) {
    auth = null;
  } else if (options.auth) {
    const authError = validateAuth(options.auth);
    if (authError) { console.error('Error:', authError); process.exit(1); }
    auth = options.auth;
  }

  // WebSocket: --no-websocket disables; --websocket enables; otherwise keep existing
  let websocket = existing.websocket;
  if (options.noWebsocket) {
    websocket = false;
  } else if (options.websocket) {
    websocket = true;
  }

  // Exact: --exact enables; once on it stays unless no-exact (not in spec, ignored)
  let exact = existing.exact;
  if (options.exact) {
    exact = true;
  }

  // Keep original createdAt
  const params = {
    name:      appName,
    port,
    path:      urlPath,
    auth,
    websocket,
    exact,
    domain:    existing.domain || config.domain,
    createdAt: existing.createdAt,
  };

  const content = generateConfig(params, config);
  writeConfigFile(filePath, content);

  console.log(`Updated: ${filePath}`);
  console.log(`Route:   https://${config.domain}${urlPath}  →  localhost:${port}`);
  if (auth)      console.log(`Auth:    ${auth}`);
  if (websocket) console.log(`WebSocket support enabled`);
  if (exact)     console.log(`Exact match: location = ${urlPath}`);
  console.log('');
  console.log('Run "sudo nginx-manager reload" to apply changes.');
}

module.exports = edit;
