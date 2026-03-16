// Input validation helpers
// Each function returns an error string or null if valid

const VALID_AUTH_TYPES = ['basic', 'ip', 'token'];

/**
 * Validate app name: lowercase letters, numbers, hyphens; 1-50 chars
 */
function validateName(name) {
  if (!name || name.trim() === '') return 'App name is required';
  if (!/^[a-z0-9-]+$/.test(name)) {
    return 'App name must contain only lowercase letters, numbers, and hyphens';
  }
  if (name.length > 50) return 'App name must be 50 characters or less';
  if (name.startsWith('-') || name.endsWith('-')) {
    return 'App name must not start or end with a hyphen';
  }
  return null;
}

/**
 * Validate port: integer between 1 and 65535
 */
function validatePort(port) {
  const portNum = parseInt(port, 10);
  if (isNaN(portNum) || String(portNum) !== String(port)) {
    return 'Port must be a whole number';
  }
  if (portNum < 1 || portNum > 65535) return 'Port must be between 1 and 65535';
  return null;
}

/**
 * Validate URL path: must start with /, no spaces
 */
function validatePath(pathStr) {
  if (!pathStr || pathStr.trim() === '') return 'Path is required';
  if (!pathStr.startsWith('/')) return 'Path must start with /';
  if (/\s/.test(pathStr)) return 'Path must not contain spaces';
  return null;
}

/**
 * Validate auth type: basic | ip | token (or null/undefined for none)
 */
function validateAuth(auth) {
  if (auth === null || auth === undefined || auth === 'none') return null;
  if (!VALID_AUTH_TYPES.includes(auth)) {
    return `Auth must be one of: ${VALID_AUTH_TYPES.join(', ')} (or omit for none)`;
  }
  return null;
}

module.exports = { validateName, validatePort, validatePath, validateAuth };
