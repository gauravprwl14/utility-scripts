# context.md — claude-code-credentials-switch

## What This Project Does

This is a Node.js CLI tool that automates switching client credentials (tokens, refresh tokens, expiry, type) across one or more destination JSON config files. It reads credentials for a named client ID from a central source file and writes them into target files — either at the root level or at a nested path inside the JSON structure.

The core problem it solves: when you have multiple API clients or environments (clientA, clientB, production, staging) and need to quickly swap which set of credentials are active in your app's config files, this script does it in one command instead of manual copy-paste.

---

## Architecture & File Map

```
claude-code-credentials-switch/
├── switch-credentials.js    # Main script — CLI entry point and core logic
├── constants.js             # PROPERTY_MAP defining source→destination key mapping
├── package.json             # Project metadata, depends on dotenv
├── .env                     # Active environment config (gitignored in practice)
├── .env.example             # Documented template for .env with all options explained
└── example/                 # Working example files for testing
    ├── config.json          # Example destination file (nested auth object)
    ├── simple-config.json   # Example destination file (root level)
    ├── credentials.json     # Example source file with inline + external clients
    ├── external/
    │   └── clientA.json     # Example external credential file
    └── README.md            # Example-specific documentation
```

---

## How Each File Works

### `switch-credentials.js` (main script, 192 lines)

The entry point. When run directly (`node switch-credentials.js`), it:

1. **Parses CLI args** — positional: `<sourceFile> <clientId> <destDir> <destFile1> [destFile2...] [--destPath=nested.path]`
2. **Falls back to .env** — any missing CLI arg is read from environment variables (`SOURCE_FILE`, `CLIENT_ID`, `DEST_DIR`, `DEST_FILES`, `DEST_PATH`)
3. **Loads the source file** — reads the JSON, looks up the `clientId` key
4. **Resolves credential kind**:
   - `inline` — credentials are directly in the source JSON under the client key
   - `external` — a `source` field points to another JSON file; optionally a `fields` array specifies which fields to extract (using dot notation like `auth.token`)
5. **Applies PROPERTY_MAP** — maps source keys (e.g., `refresh_token`) to destination keys (e.g., `refreshToken`), unless `skipMapping` is true (external with explicit `fields`)
6. **Writes to each destination file** — loads the dest JSON, merges credentials at root or at `destPath` (dot-notation nested path), saves back

Key functions:
- `getNestedObject(obj, path)` / `setNestedObject(obj, path, valueObj)` — dot-notation traversal
- `loadCredentials(credConfig, sourceFileDir)` — handles inline vs external resolution
- `switchCredentials({ sourceFile, clientId, destDir, destFiles, destPath })` — main orchestrator
- `extractField(obj, fieldPath)` / `getFieldName(fieldPath)` — field extraction helpers

### `constants.js` (11 lines)

Exports `PROPERTY_MAP` — a simple object mapping source credential keys to destination keys:
```js
{ token: 'token', refresh_token: 'refreshToken', expiry: 'expiry', type: 'type' }
```
This is what transforms `refresh_token` (source) → `refreshToken` (destination). Only used when `skipMapping` is false.

### `.env.example`

Documents all 5 configuration variables:
- `SOURCE_FILE` — path to source credentials JSON
- `CLIENT_ID` — which client to use from the source
- `DEST_DIR` — directory containing destination files
- `DEST_FILES` — comma-separated list of destination filenames
- `DEST_PATH` — optional dot-notation path for nested credential placement

---

## Data Flow (End to End)

```
CLI args / .env
       │
       ▼
┌─ Source JSON (credentials.json) ──┐
│  "clientA": {                     │
│    "kind": "external",            │──▶ Loads external/clientA.json
│    "source": "./external/...",    │    Extracts specified fields
│    "fields": ["auth.token", ...]  │
│  }                                │
│  "clientB": {                     │
│    "kind": "inline",              │──▶ Uses inline values directly
│    "token": "...",                │
│    "refresh_token": "..."         │
│  }                                │
└───────────────────────────────────┘
       │
       ▼  PROPERTY_MAP (if not skipMapping)
       │  refresh_token → refreshToken
       ▼
┌─ Destination JSON (config.json) ──┐
│  "auth": {                        │  ← destPath="auth"
│    "token": "NEW_VALUE",          │
│    "refreshToken": "NEW_VALUE"    │
│  }                                │
└───────────────────────────────────┘
```

---

## Credential Kinds Explained

### Inline Credentials
Source file contains the actual values directly under the client key. All keys except `kind` are treated as credential fields:
```json
{ "clientB": { "kind": "inline", "token": "xyz", "refresh_token": "abc", "expiry": "...", "type": "Bearer" } }
```

### External Credentials
Source file points to another JSON file via `source`. Two sub-modes:
1. **With `fields` array** — only extract the listed fields (dot-notation), skip PROPERTY_MAP mapping (fields are already in destination format)
2. **Without `fields`** — extract all keys that exist in PROPERTY_MAP, then apply mapping

---

## Usage

```bash
# Using CLI args
node switch-credentials.js example/credentials.json clientA example/ simple-config.json

# With nested destination path
node switch-credentials.js example/credentials.json clientA example/ config.json --destPath=auth

# Using .env file (no args needed)
cp .env.example .env  # edit values
node switch-credentials.js

# Multiple destination files
node switch-credentials.js creds.json prod ./configs/ api.json worker.json scheduler.json
```

---

## Dependencies

- **Node.js** (CommonJS modules)
- **dotenv** (^17.3.1) — loads `.env` file

---

## Important Implementation Details

- CLI args always override .env values
- The script exits with code 1 on any error (missing client, failed file reads)
- `loadJson` / `saveJson` use synchronous fs operations (readFileSync/writeFileSync)
- External file paths are resolved relative to the source file's directory, not CWD
- When `fields` are specified on an external credential, the mapping step is completely skipped — the extracted field names are used as-is in the destination
- The script can be both sourced (as a module) and run directly — guarded by `require.main === module`
- JSON files are written with 2-space indentation (`JSON.stringify(data, null, 2)`)
