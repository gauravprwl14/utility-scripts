# Credential Switch Script

This script automates switching client credentials in destination JSON files. It supports both inline credentials and external file references with selective field extraction.

## Features

- **Inline Credentials**: Store credentials directly in the source file
- **External File References**: Reference credentials from separate files
- **Selective Field Extraction**: Extract specific nested properties using dot notation
- **Property Mapping**: Automatic mapping between different naming conventions
- **Nested Object Support**: Update credentials in nested destination objects
- **Flexible Configuration**: Use CLI arguments or `.env` file

## Credential Types

### Inline Credentials

Store credentials directly in the source JSON:

```json
{
  "clientB": {
    "kind": "inline",
    "token": "token_xyz789",
    "refresh_token": "refresh_xyz789",
    "expiry": "2026-03-01T12:00:00Z",
    "type": "Bearer"
  }
}
```

### External File Reference

Reference credentials from an external file with selective field extraction:

```json
{
  "clientA": {
    "kind": "external",
    "source": "./external/clientA.json",
    "fields": ["auth.token", "auth.refreshToken", "auth.expiry", "auth.type"]
  }
}
```

The `fields` array uses dot notation to extract nested properties. The last segment becomes the destination property name (e.g., `auth.token` → `token`).

## Usage

```
node switch-credentials.js <sourceFile> <clientId> <destDir> <destFile1> [destFile2 ...]
```

- `<sourceFile>`: Path to the source credentials JSON file (with multiple client IDs)
- `<clientId>`: The client ID to use as the source
- `<destDir>`: Directory containing destination JSON files
- `<destFile1> [destFile2 ...]`: One or more destination JSON files to update

## Example

**Source credentials.json:**
```json
{
  "clientA": {
    "token": "abc123",
    "refresh_token": "refA",
    "expiry": "2026-02-21T12:00:00Z",
    "type": "Bearer"
  },
  "clientB": {
    "token": "xyz789",
    "refresh_token": "refB",
    "expiry": "2026-03-01T12:00:00Z",
    "type": "Bearer"
  }
}
```

**Destination config.json (before):**
```json
{
  "token": "oldToken",
  "refreshToken": "oldRefresh",
  "otherSetting": true
}
```

**Command:**
```
node switch-credentials.js credentials.json clientB ./ config.json
```

**Destination config.json (after):**
```json
{
  "token": "xyz789",
  "refreshToken": "refB",
  "otherSetting": true
}
```

## Nested Object Support

The script supports updating credentials in nested objects using the `--destPath` argument:

```
node switch-credentials.js credentials.json clientA ./ config.json --destPath=auth
```

This will update properties inside the `auth` object instead of at the root level.

## Configuration via .env

You can set default values in a `.env` file. See `.env.example` for a complete template with documentation.

**Basic setup:**

```env
SOURCE_FILE=credentials.json
CLIENT_ID=clientA
DEST_DIR=./
DEST_FILES=config.json
DEST_PATH=auth
```

Then run without arguments:
```bash
node switch-credentials.js
```

CLI arguments override `.env` values, allowing for flexible usage:
```bash
# Override only clientId, use rest from .env
node switch-credentials.js example/credentials.json clientB
```

**Multiple destination files:**
```env
DEST_FILES=config.json,app-config.json,service-config.json
```

Copy `.env.example` to `.env` and customize for your environment.

## Example

See the `example/` folder for working demonstrations:
- `example/credentials.json` - Source credentials with multiple clients (inline and external)
- `example/external/clientA.json` - External credential file for clientA
- `example/config.json` - Destination with nested auth object
- `example/simple-config.json` - Destination with flat structure

### Example 1: External Credentials with Nested Destination

**Source credentials.json:**
```json
{
  "clientA": {
    "kind": "external",
    "source": "./external/clientA.json",
    "fields": ["auth.token", "auth.refreshToken", "auth.expiry", "auth.type"]
  }
}
```

**External file (external/clientA.json):**
```json
{
  "auth": {
    "token": "external_token_abc",
    "refreshToken": "external_refresh_abc",
    "expiry": "2026-06-15T10:30:00Z",
    "type": "Bearer"
  }
}
```

**Command:**
```bash
node switch-credentials.js example/credentials.json clientA example/ config.json --destPath=auth
```

**Result:** Updates `config.json` auth object with values extracted from external file.

### Example 2: Inline Credentials with Flat Destination

**Source credentials.json:**
```json
{
  "clientB": {
    "kind": "inline",
    "token": "token_xyz789",
    "refresh_token": "refresh_xyz789",
    "expiry": "2026-03-01T12:00:00Z",
    "type": "Bearer"
  }
}
```

**Command:**
```bash
node switch-credentials.js example/credentials.json clientB example/ simple-config.json
```

**Result:** Updates `simple-config.json` with inline credentials, applying property mapping (`refresh_token` → `refreshToken`).

## Notes

### Property Mapping
- Only the properties `token`, `refreshToken`, `expiry`, and `type` are updated
- Automatic mapping: `refresh_token` → `refreshToken` (configurable in `constants.js`)
- Other properties in destination files are preserved

### Credential Type Detection
- **Explicit**: Use `"kind": "inline"` or `"kind": "external"`
- **Auto-detect**: If `kind` is omitted, presence of `source` determines external type
- Follows Kubernetes API naming conventions

### Field Extraction
- Use dot notation for nested paths: `"auth.token"`
- Last segment becomes destination property name
- Only specified `fields` are extracted from external files
- If `fields` is omitted, uses `PROPERTY_MAP` keys

### Multiple Capabilities
- Handles multiple destination files in one run
- Supports flexible source file paths (any directory)
- Backwards compatible with previous credential format
