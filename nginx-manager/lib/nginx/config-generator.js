// Pure function: config params → nginx .conf string
// Generates the full file content including metadata comment header.

const AUTH_SNIPPET = {
  basic: 'security-basic-auth.conf',
  ip:    'security-ip-whitelist.conf',
  token: 'security-token-header.conf',
};

/**
 * Generate a managed nginx config file.
 *
 * @param {object} params
 *   name        {string}  app name
 *   port        {number}  local port
 *   path        {string}  URL path prefix (e.g. /my-app)
 *   auth        {string|null}  'basic'|'ip'|'token'|null
 *   websocket   {boolean}
 *   exact       {boolean}  use "location = /path" instead of "location /path"
 *   domain      {string}  for documentation header
 *   createdAt   {string}  ISO timestamp (defaults to now)
 *
 * @param {object} config  getConfig() result
 *   snippetDir  {string}
 *
 * @returns {string} full .conf file content
 */
function generateConfig(params, config) {
  const {
    name,
    port,
    path,
    auth = null,
    websocket = false,
    exact = false,
    domain,
    createdAt = new Date().toISOString(),
  } = params;

  const { snippetDir } = config;

  // --- Metadata comment header (machine-readable) ---
  const header = [
    '# nginx-manager: managed config',
    `# app-name: ${name}`,
    `# port: ${port}`,
    `# path: ${path}`,
    `# auth: ${auth || 'none'}`,
    `# websocket: ${websocket ? 'true' : 'false'}`,
    `# exact: ${exact ? 'true' : 'false'}`,
    `# created-at: ${createdAt}`,
    `# domain: ${domain}`,
    '',
  ].join('\n');

  // --- Location block ---
  const locationDirective = exact ? `location = ${path}` : `location ${path}`;

  const lines = [
    `${locationDirective} {`,
    `    proxy_pass http://localhost:${port};`,
    `    include ${snippetDir}/proxy-params.conf;`,
  ];

  if (websocket) {
    lines.push('    proxy_http_version 1.1;');
    lines.push('    proxy_set_header Upgrade $http_upgrade;');
    lines.push('    proxy_set_header Connection $connection_upgrade;');
    lines.push('    proxy_connect_timeout 7d;');
    lines.push('    proxy_send_timeout 7d;');
    lines.push('    proxy_read_timeout 7d;');
  }

  if (auth && AUTH_SNIPPET[auth]) {
    lines.push(`    include ${snippetDir}/${AUTH_SNIPPET[auth]};`);
  }

  lines.push('}');

  return header + lines.join('\n') + '\n';
}

module.exports = { generateConfig };
