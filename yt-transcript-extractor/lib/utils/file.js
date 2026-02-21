// File operation utilities
// Purpose: File I/O operations and directory management

const fs = require('fs');
const path = require('path');

/**
 * Ensure directory exists, create if not
 * @param {string} dirPath - Directory path
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Write content to file with optional duplicate check
 * @param {string} filePath - File path
 * @param {string} content - Content to write
 * @param {boolean} skipIfExists - Skip if file exists (default: true)
 * @returns {boolean} True if written, false if skipped
 */
function writeFile(filePath, content, skipIfExists = true) {
  if (skipIfExists && fs.existsSync(filePath)) {
    console.warn(`Warning: File already exists, skipping: ${filePath}`);
    return false;
  }
  
  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
}

/**
 * Read file content
 * @param {string} filePath - File path
 * @returns {string|null} File content or null if not exists
 */
function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Append content to file
 * @param {string} filePath - File path
 * @param {string} content - Content to append
 */
function appendFile(filePath, content) {
  fs.appendFileSync(filePath, content, 'utf-8');
}

/**
 * Check if file exists
 * @param {string} filePath - File path
 * @returns {boolean} True if exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

module.exports = {
  ensureDirectoryExists,
  writeFile,
  readFile,
  appendFile,
  fileExists,
};
