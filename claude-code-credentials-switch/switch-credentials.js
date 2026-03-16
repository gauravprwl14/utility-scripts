#!/usr/bin/env node
// Credential Switch Script
// Switches token/refreshToken/etc. in destination JSON files from a source client credential


const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PROPERTY_MAP } = require('./constants');

// Load .env file
dotenv.config({ path: path.join(__dirname, '.env') });

// Helper: Traverse to nested object by path (e.g., 'auth', 'settings.auth')
function getNestedObject(obj, path) {
  if (!path) return obj;
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

function setNestedObject(obj, path, valueObj) {
  if (!path) {
    Object.assign(obj, valueObj);
    return;
  }
  const keys = path.split('.');
  let target = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!target[keys[i]]) target[keys[i]] = {};
    target = target[keys[i]];
  }
  if (!target[keys[keys.length - 1]]) target[keys[keys.length - 1]] = {};
  Object.assign(target[keys[keys.length - 1]], valueObj);
}

function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`Failed to read or parse ${filePath}:`, e.message);
    return null;
  }
}

function saveJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Failed to write ${filePath}:`, e.message);
  }
}

// Extract value from nested object using dot notation (e.g., 'auth.token')
function extractField(obj, fieldPath) {
  return fieldPath.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

// Get the last segment of a field path (e.g., 'auth.token' -> 'token')
function getFieldName(fieldPath) {
  const parts = fieldPath.split('.');
  return parts[parts.length - 1];
}

// Load and process credentials based on kind (inline or external)
function loadCredentials(credConfig, sourceFileDir) {
  // Auto-detect kind if not specified (backwards compatibility)
  const kind = credConfig.kind || (credConfig.source ? 'external' : 'inline');
  
  if (kind === 'external') {
    // Load from external file
    const externalPath = path.resolve(sourceFileDir, credConfig.source);
    const externalData = loadJson(externalPath);
    if (!externalData) {
      console.error(`Failed to load external credentials from ${externalPath}`);
      return null;
    }
    
    // Extract specified fields or use PROPERTY_MAP keys
    const result = {};
    if (credConfig.fields && Array.isArray(credConfig.fields)) {
      // Selective field extraction - fields already in destination format
      credConfig.fields.forEach(fieldPath => {
        const value = extractField(externalData, fieldPath);
        if (value !== undefined) {
          const fieldName = getFieldName(fieldPath);
          result[fieldName] = value;
        }
      });
      return { mappedProps: result, skipMapping: true };
    } else {
      // Extract all properties based on PROPERTY_MAP
      Object.keys(PROPERTY_MAP).forEach(key => {
        if (externalData[key] !== undefined) {
          result[key] = externalData[key];
        }
      });
      return { mappedProps: result, skipMapping: false };
    }
  } else if (kind === 'inline') {
    // Use inline credentials, excluding metadata fields
    const result = {};
    Object.keys(credConfig).forEach(key => {
      if (key !== 'kind') {
        result[key] = credConfig[key];
      }
    });
    return { mappedProps: result, skipMapping: false };
  } else {
    console.error(`Unknown credential kind: ${kind}`);
    return null;
  }
}

function switchCredentials({ sourceFile, clientId, destDir, destFiles, destPath }) {
  const sourceObj = loadJson(sourceFile);
  if (!sourceObj || !sourceObj[clientId]) {
    console.error(`Source credential for '${clientId}' not found in ${sourceFile}.`);
    process.exit(1);
  }
  const credConfig = sourceObj[clientId];
  const sourceFileDir = path.dirname(path.resolve(sourceFile));

  // Load credentials (inline or external)
  const credResult = loadCredentials(credConfig, sourceFileDir);
  if (!credResult) {
    console.error(`Failed to load credentials for '${clientId}'.`);
    process.exit(1);
  }

  // Prepare mapped properties
  let mappedProps;
  if (credResult.skipMapping) {
    // Fields are already in destination format (from external with specific fields)
    mappedProps = credResult.mappedProps;
  } else {
    // Apply property mapping (for inline or external without specific fields)
    mappedProps = {};
    Object.entries(PROPERTY_MAP).forEach(([srcKey, destKey]) => {
      if (credResult.mappedProps[srcKey] !== undefined) {
        mappedProps[destKey] = credResult.mappedProps[srcKey];
      }
    });
  }

  destFiles.forEach(destFile => {
    const destFilePath = path.join(destDir, destFile);
    const destObj = loadJson(destFilePath);
    if (!destObj) return;

    // Update nested object if destPath is provided
    if (destPath) {
      const nestedObj = getNestedObject(destObj, destPath);
      if (!nestedObj) {
        console.error(`Nested path '${destPath}' not found in ${destFile}`);
        return;
      }
      Object.assign(nestedObj, mappedProps);
    } else {
      Object.assign(destObj, mappedProps);
    }
    saveJson(destFilePath, destObj);
    console.log(`Updated ${destFile} (${destPath ? 'nested: ' + destPath : 'root'}) with credentials from ${clientId}`);
  });
}

// --- CLI ARGUMENT PARSING ---
if (require.main === module) {
  // CLI args override .env
  const [,, argSourceFile, argClientId, argDestDir, ...restArgs] = process.argv;
  let argDestFiles = [];
  let argDestPath = undefined;
  // Support --destPath=<nestedPath> as last arg
  restArgs.forEach(arg => {
    if (arg.startsWith('--destPath=')) {
      argDestPath = arg.replace('--destPath=', '');
    } else {
      argDestFiles.push(arg);
    }
  });

  const sourceFile = argSourceFile || process.env.SOURCE_FILE;
  const clientId = argClientId || process.env.CLIENT_ID;
  const destDir = argDestDir || process.env.DEST_DIR;
  let destFiles = argDestFiles.length > 0 ? argDestFiles : (process.env.DEST_FILES ? process.env.DEST_FILES.split(',') : []);
  const destPath = argDestPath || process.env.DEST_PATH;

  if (!sourceFile || !clientId || !destDir || destFiles.length === 0) {
    console.log('Usage: node switch-credentials.js <sourceFile> <clientId> <destDir> <destFile1> [destFile2 ...] [--destPath=nested.path]');
    console.log('Or set values in .env file');
    process.exit(1);
  }
  switchCredentials({ sourceFile, clientId, destDir, destFiles, destPath });
}
