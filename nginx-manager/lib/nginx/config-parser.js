// Reads structured metadata from the comment header of a managed config file.
// Only files starting with "# nginx-manager: managed config" are parsed.

const { readFile } = require('../utils/file');

/**
 * Parse metadata from the content string of a managed config file.
 * Returns null if the file is not a managed config.
 *
 * @param {string} content  raw file content
 * @returns {object|null}   metadata object or null
 */
function parseConfigContent(content) {
  if (!content || !content.startsWith('# nginx-manager: managed config')) {
    return null;
  }

  const metadata = {};
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.trim() === '') break; // blank line separates header from body
    if (!line.startsWith('#')) break;

    const match = line.match(/^# ([a-z-]+): (.+)$/);
    if (match) {
      metadata[match[1]] = match[2].trim();
    }
  }

  return {
    name:      metadata['app-name'] || null,
    port:      parseInt(metadata['port'], 10) || null,
    path:      metadata['path'] || null,
    auth:      (metadata['auth'] && metadata['auth'] !== 'none') ? metadata['auth'] : null,
    websocket: metadata['websocket'] === 'true',
    exact:     metadata['exact'] === 'true',
    createdAt: metadata['created-at'] || null,
    domain:    metadata['domain'] || null,
  };
}

/**
 * Read a config file from disk and parse its metadata.
 * Returns null if the file doesn't exist or is not a managed config.
 *
 * @param {string} filePath  absolute path to the .conf file
 * @returns {object|null}
 */
function parseConfigFile(filePath) {
  const content = readFile(filePath);
  if (!content) return null;
  return parseConfigContent(content);
}

module.exports = { parseConfigContent, parseConfigFile };
