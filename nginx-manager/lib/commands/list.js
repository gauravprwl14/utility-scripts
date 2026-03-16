// Command: nginx-manager list
// Lists all managed route configs in the apps directory.

const { getConfig } = require('../../config');
const { listManagedConfigs } = require('../utils/file');
const { parseConfigFile } = require('../nginx/config-parser');

function list() {
  const config = getConfig();
  const files = listManagedConfigs(config.appsDir, config.prefix);

  if (files.length === 0) {
    console.log('No managed configs found in', config.appsDir);
    return;
  }

  const rows = [];
  for (const filePath of files) {
    const meta = parseConfigFile(filePath);
    if (!meta) {
      // File matched the naming pattern but has no managed header — skip silently
      continue;
    }
    rows.push(meta);
  }

  if (rows.length === 0) {
    console.log('No managed configs found in', config.appsDir);
    return;
  }

  // --- Table header ---
  const COL = { name: 20, port: 8, path: 22, auth: 10, ws: 6, exact: 5 };
  const header =
    'NAME'.padEnd(COL.name) +
    'PORT'.padEnd(COL.port) +
    'PATH'.padEnd(COL.path) +
    'AUTH'.padEnd(COL.auth) +
    'WS'.padEnd(COL.ws) +
    'EXACT';
  const divider = '-'.repeat(
    COL.name + COL.port + COL.path + COL.auth + COL.ws + 5
  );

  console.log('');
  console.log(header);
  console.log(divider);

  for (const m of rows) {
    const name = (m.name || '?').padEnd(COL.name);
    const port = String(m.port || '?').padEnd(COL.port);
    const urlPath = (m.path || '?').padEnd(COL.path);
    const auth = (m.auth || 'none').padEnd(COL.auth);
    const ws = (m.websocket ? 'yes' : 'no').padEnd(COL.ws);
    const exact = m.exact ? 'yes' : 'no';
    console.log(name + port + urlPath + auth + ws + exact);
  }

  console.log('');
  console.log(`${rows.length} route(s) in ${config.appsDir}`);
  console.log('');
}

module.exports = list;
