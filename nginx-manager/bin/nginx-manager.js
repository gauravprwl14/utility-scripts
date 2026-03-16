#!/usr/bin/env node
// nginx-manager — CLI for managing Nginx path-based proxy routes
// Usage: node bin/nginx-manager.js <command> [args] [options]

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { parseArgs } = require('../lib/utils/args');

const COMMANDS = {
  add:    require('../lib/commands/add'),
  list:   require('../lib/commands/list'),
  remove: require('../lib/commands/remove'),
  edit:   require('../lib/commands/edit'),
  status: require('../lib/commands/status'),
  reload: require('../lib/commands/reload'),
};

function printUsage() {
  console.log(`
Usage: nginx-manager <command> [options]

Commands:
  add <app-name> <port>   Add a new proxy route
  list                    List all managed routes
  remove <app-name>       Remove a proxy route
  edit <app-name>         Edit an existing route
  status                  Show nginx service status
  reload                  Test config and reload nginx

Options for add/edit:
  --path /custom-path     URL path prefix (default: /<app-name>)
  --auth basic|ip|token   Auth type (default: none)
  --websocket             Enable WebSocket support
  --exact                 Use exact path match (location = /path)
  --no-websocket          (edit only) Disable WebSocket
  --no-auth               (edit only) Remove auth
  --port <new-port>       (edit only) Change local port

Examples:
  sudo node bin/nginx-manager.js add my-app 3000
  sudo node bin/nginx-manager.js add api 8080 --path /api --auth basic --websocket
  node bin/nginx-manager.js list
  sudo node bin/nginx-manager.js edit my-app --port 3001 --no-auth
  sudo node bin/nginx-manager.js remove my-app
  node bin/nginx-manager.js status
  sudo node bin/nginx-manager.js reload
`.trim());
}

function main() {
  const parsed = parseArgs(process.argv);

  if (!parsed.command || parsed.command === 'help' || parsed.command === '--help' || parsed.command === '-h') {
    printUsage();
    process.exit(0);
  }

  const handler = COMMANDS[parsed.command];
  if (!handler) {
    console.error(`Error: Unknown command "${parsed.command}"`);
    console.error('');
    printUsage();
    process.exit(1);
  }

  try {
    handler(parsed);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
