// Configuration loader for base URL, token, and target URL
// Priority: ENV > script params > constants
// Throws error if any required value is missing
// Usage: const config = getConfig(process.argv)

const path = require('path');
const os = require('os');

const CONSTANTS = {
  BASE_URL: 'https://www.longcut.ai',
  TOKEN: '', // fallback, should be empty
  TARGET_URL: '', // fallback, should be empty
  OUTPUT_DIR: path.join(__dirname, '..', 'output'),
};

/**
 * Expand tilde (~) in file paths to home directory
 * @param {string} filepath - Path that may contain ~
 * @returns {string} Expanded absolute path
 */
function expandTilde(filepath) {
  if (!filepath) return filepath;
  if (filepath.startsWith('~/')) {
    return path.join(os.homedir(), filepath.slice(2));
  }
  return filepath;
}

/**
 * Loads configuration values with priority: ENV > params > constants
 * @param {Array} argv - process.argv array
 * @returns {Object} config
 */
function getConfig(argv) {
  // Parse script params
  const args = {};
  argv.slice(2).forEach(arg => {
    const [key, value] = arg.split('=');
    if (key && value) args[key.replace(/^--/, '')] = value;
  });

  // Load values
  const baseUrl = process.env.BASE_URL || args.baseUrl || CONSTANTS.BASE_URL;
  const token = process.env.TLDW_GUEST_TOKEN || args.token || CONSTANTS.TOKEN;
  const targetUrl = process.env.TARGET_URL || args.url || CONSTANTS.TARGET_URL;
  const outputDir = expandTilde(
    args.outDir || process.env.OUTPUT_DIR || CONSTANTS.OUTPUT_DIR
  );

  // Error handling
  if (!baseUrl) throw new Error('Missing BASE_URL');
  if (!token) throw new Error('Missing TLDW_GUEST_TOKEN');
  if (!targetUrl) throw new Error('Missing TARGET_URL');

  return { baseUrl, token, targetUrl, outputDir };
}

module.exports = { getConfig };