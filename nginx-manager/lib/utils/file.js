// File system utilities for nginx-manager
// Wraps fs operations with helpful error messages for permission failures

const fs = require('fs');
const path = require('path');

/**
 * Check if a file or directory exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Read a file; returns null if it doesn't exist
 */
function readFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Write (overwrite) a file. Throws with a helpful message on EACCES.
 */
function writeConfigFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
  } catch (err) {
    if (err.code === 'EACCES') {
      throw new Error(`Permission denied writing to: ${filePath}\nTry running with sudo`);
    }
    throw err;
  }
}

/**
 * Delete a file. Throws with a helpful message on EACCES.
 */
function deleteFile(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    if (err.code === 'EACCES') {
      throw new Error(`Permission denied deleting: ${filePath}\nTry running with sudo`);
    }
    if (err.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw err;
  }
}

/**
 * List all conf files in appsDir matching <prefix>-*.conf
 * Returns array of absolute file paths. Returns [] if dir doesn't exist.
 */
function listManagedConfigs(appsDir, prefix) {
  if (!fs.existsSync(appsDir)) return [];
  const files = fs.readdirSync(appsDir);
  return files
    .filter(f => f.startsWith(`${prefix}-`) && f.endsWith('.conf'))
    .sort()
    .map(f => path.join(appsDir, f));
}

module.exports = { fileExists, readFile, writeConfigFile, deleteFile, listManagedConfigs };
