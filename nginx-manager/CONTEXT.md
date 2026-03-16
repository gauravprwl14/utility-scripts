# context.md — nginx-manager

## What This Project Does

A Node.js CLI tool for managing Nginx path-based reverse proxy routes. It generates, reads, edits, and removes Nginx `location` block config files stored in a dedicated directory (`/etc/nginx/apps.d/`). Each managed route gets its own `.conf` file with a machine-readable metadata header, allowing the tool to round-trip configs (read existing → modify → regenerate).

The core problem: manually writing and maintaining Nginx config snippets for reverse proxying local services is error-prone and repetitive. This tool provides a structured CLI to add/edit/remove/list routes with support for WebSocket proxying, authentication snippets, and exact path matching.

---

## Architecture & File Map

```
nginx-manager/
├── bin/
│   └── nginx-manager.js              # CLI entry point — command router
├── config.js                         # Configuration loader (env vars + defaults)
├── lib/
│   ├── commands/                     # One file per CLI command
│   │   ├── add.js                    # Create new route config
│   │   ├── edit.js                   # Modify existing route config
│   │   ├── list.js                   # Display all managed routes as table
│   │   ├── remove.js                 # Delete a managed route config
│   │   ├── status.js                 # Show nginx service status
│   │   └── reload.js                 # Test config then reload nginx
│   ├── nginx/                        # Nginx-specific logic
│   │   ├── config-generator.js       # Pure function: params → .conf string
│   │   ├── config-parser.js          # Parse metadata from .conf header comments
│   │   └── nginx-runner.js           # Shell wrappers: nginx -t, systemctl reload/status
│   └── utils/                        # Shared utilities
│       ├── args.js                   # Manual argv parser (no external deps)
│       ├── file.js                   # File I/O with permission error handling
│       └── validate.js               # Input validation (name, port, path, auth)
├── docs/
│   └── examples/                     # Example generated .conf files
│       ├── basic-app.conf
│       ├── websocket.conf
│       ├── websocket-with-auth.conf
│       ├── auth-basic.conf
│       ├── auth-ip.conf
│       ├── auth-token.conf
│       └── exact-match.conf
├── .env / .env.example               # Environment configuration
├── .gitignore
├── package.json                      # Depends only on dotenv
└── README.md
```

---

## Core Design Pattern: File-Based Registry

Instead of a database, nginx-manager uses **machine-readable comment headers** in `.conf` files as the single source of truth:

```nginx
# nginx-manager: managed config
# app-name: my-app
# port: 3000
# path: /my-app
# auth: none
# websocket: false
# exact: false
# created-at: 2024-01-15T10:30:00Z
# domain: rnd.blr0.geekydev.com
```

When you run `list` or `edit`, the tool reads these headers from files rather than querying a database. This ensures configs are version-controllable and the file system IS the registry.

---

## How Each File Works

### `bin/nginx-manager.js` — Entry Point (75 lines)

Loads dotenv, imports all 6 command handlers into a `COMMANDS` map, parses argv via `lib/utils/args.js`, dispatches to the matching handler. Prints usage on `--help` or unknown command.

### `config.js` — Configuration (16 lines)

Reads 4 settings from env vars with defaults:
- `NGINX_APPS_DIR` → `/etc/nginx/apps.d` — where .conf files are stored
- `NGINX_PREFIX` → `rnd` — filename prefix (e.g., `rnd-myapp.conf`)
- `NGINX_DOMAIN` → `rnd.blr0.geekydev.com` — domain for documentation headers
- `NGINX_SNIPPETS` → `/etc/nginx/snippets` — directory for included snippet files

### `lib/commands/add.js` — Add Command (73 lines)

Creates a new route. Flow:
1. Validates app name, port, URL path, auth type
2. Checks config doesn't already exist (prevents overwrite)
3. Builds params object with defaults (`--path` defaults to `/<app-name>`)
4. Calls `generateConfig()` to produce the .conf content
5. Writes the file to `<appsDir>/<prefix>-<appName>.conf`
6. Prints summary with the created route URL

### `lib/commands/edit.js` — Edit Command (113 lines)

Modifies an existing route. Flow:
1. Validates app name, reads existing config via `parseConfigFile()`
2. Merges CLI options over existing metadata:
   - `--port` overrides port
   - `--path` overrides URL path
   - `--auth` / `--no-auth` sets/removes authentication
   - `--websocket` / `--no-websocket` toggles WebSocket support
   - `--exact` enables exact matching
3. Preserves original `createdAt` timestamp
4. Regenerates and overwrites the .conf file

### `lib/commands/list.js` — List Command (64 lines)

Lists all managed routes as a formatted table:
1. Scans `appsDir` for files matching `<prefix>-*.conf`
2. Parses each file's metadata header via `parseConfigFile()`
3. Renders table with columns: NAME, PORT, PATH, AUTH, WS, EXACT

### `lib/commands/remove.js` — Remove Command (44 lines)

Deletes a managed route. Validates the file is a managed config (has the metadata header) before deleting — refuses to delete non-managed files.

### `lib/commands/status.js` — Status Command (11 lines)

Runs `systemctl status nginx` with `stdio: 'inherit'` to show output directly.

### `lib/commands/reload.js` — Reload Command (30 lines)

Two-step safety: runs `nginx -t` first. Only proceeds with `systemctl reload nginx` if the config test passes.

### `lib/nginx/config-generator.js` — Config Generator (83 lines)

Pure function — takes params and config, returns a complete `.conf` file string. Structure:
1. **Metadata header** — machine-readable comment block with all route properties
2. **Location block** — `location /path { ... }` or `location = /path { ... }` for exact match
3. **Proxy directives** — `proxy_pass`, `include proxy-params.conf`
4. **WebSocket directives** (optional) — Upgrade/Connection headers, 7-day timeouts
5. **Auth snippet include** (optional) — includes the appropriate security snippet file

Auth snippet mapping:
- `basic` → `security-basic-auth.conf`
- `ip` → `security-ip-whitelist.conf`
- `token` → `security-token-header.conf`

### `lib/nginx/config-parser.js` — Config Parser (56 lines)

Reads the metadata comment header from a .conf file. Only parses files starting with `# nginx-manager: managed config`. Extracts key-value pairs from comment lines (`# key: value`) and returns a structured object: `{ name, port, path, auth, websocket, exact, createdAt, domain }`.

Edge cases: blank line terminates header parsing, `auth: none` normalizes to `null`, `websocket: true` normalizes to boolean.

### `lib/nginx/nginx-runner.js` — Nginx Runner (44 lines)

Shell command wrappers:
- `testConfig()` — `nginx -t 2>&1` → `{ success, output }`
- `reloadNginx()` — `systemctl reload nginx 2>&1` → `{ success, output }`
- `statusNginx()` — `systemctl status nginx` with inherited stdio

### `lib/utils/args.js` — Argument Parser (85 lines)

Custom argv parser (zero dependencies). Handles:
- Positional args: `command`, `appName`, `port`
- Value options: `--path`, `--auth`, `--port`
- Boolean flags: `--websocket`, `--exact`, `--no-websocket`, `--no-auth`
- Converts kebab-case to camelCase (`no-websocket` → `noWebsocket`)

### `lib/utils/validate.js` — Validators (54 lines)

Each returns error string or null:
- `validateName()` — lowercase alphanumeric + hyphens, 1-50 chars, no leading/trailing hyphens
- `validatePort()` — integer 1-65535
- `validatePath()` — must start with `/`, no spaces
- `validateAuth()` — must be `basic`, `ip`, or `token` (or null for none)

### `lib/utils/file.js` — File Utilities (66 lines)

Wraps `fs` operations with helpful error messages:
- `writeConfigFile()` — throws "Permission denied... Try running with sudo" on EACCES
- `deleteFile()` — same permission handling
- `listManagedConfigs(appsDir, prefix)` — lists `<prefix>-*.conf` files, sorted

---

## Data Flow: Adding a Route

```
CLI: nginx-manager add my-app 3000 --auth basic --websocket
       │
       ▼
  parseArgs(argv)
  ┌──────────────────────────────┐
  │ command: "add"               │
  │ appName: "my-app"            │
  │ port: "3000"                 │
  │ options: { auth: "basic",    │
  │   websocket: true }          │
  └──────────────────────────────┘
       │
       ▼  validate all inputs
       │
       ▼  getConfig() → { appsDir, prefix, domain, snippetDir }
       │
       ▼  Check: /etc/nginx/apps.d/rnd-my-app.conf doesn't exist
       │
       ▼  generateConfig(params, config) → .conf string
       │
       ▼  writeConfigFile(filePath, content)
       │
       ▼  Output: "Created: /etc/nginx/apps.d/rnd-my-app.conf"
              "Route: https://rnd.blr0.geekydev.com/my-app → localhost:3000"
```

---

## Generated Config File Format

```nginx
# nginx-manager: managed config
# app-name: my-app
# port: 3000
# path: /my-app
# auth: basic
# websocket: true
# exact: false
# created-at: 2026-03-13T01:30:00.000Z
# domain: rnd.blr0.geekydev.com

location /my-app {
    proxy_pass http://localhost:3000;
    include /etc/nginx/snippets/proxy-params.conf;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;
    include /etc/nginx/snippets/security-basic-auth.conf;
}
```

---

## CLI Usage

```bash
# Add a route
sudo node bin/nginx-manager.js add my-app 3000
sudo node bin/nginx-manager.js add api 8080 --path /api --auth basic --websocket

# List all routes
node bin/nginx-manager.js list

# Edit a route
sudo node bin/nginx-manager.js edit my-app --port 3001 --no-auth

# Remove a route
sudo node bin/nginx-manager.js remove my-app

# Check nginx status
node bin/nginx-manager.js status

# Test and reload nginx
sudo node bin/nginx-manager.js reload
```

---

## Nginx Integration

The main server block includes all managed configs via wildcard:
```nginx
server {
    server_name rnd.blr0.geekydev.com;
    ...
    include /etc/nginx/apps.d/rnd-*.conf;
}
```

The tool assumes these snippets exist in `/etc/nginx/snippets/`:
- `proxy-params.conf` — standard proxy headers (Host, X-Real-IP, etc.)
- `security-basic-auth.conf` — HTTP Basic authentication
- `security-ip-whitelist.conf` — IP-based access control
- `security-token-header.conf` — Bearer token / header-based auth

---

## Dependencies

- **Node.js** >= 14.0.0
- **dotenv** (^16.0.0) — loads `.env` file
- **No other runtime dependencies** — args parsing, file I/O, and nginx commands are all handled with built-in Node.js modules

---

## Important Implementation Details

- **Sudo required** for `add`, `edit`, `remove`, `reload` (writes to `/etc/nginx/`)
- **Sudo NOT required** for `list` and `status` (read-only operations)
- The metadata comment header is the source of truth for existing configs — `edit` reads it, modifies, and regenerates the entire file
- `edit` preserves the original `createdAt` timestamp through regeneration
- The `remove` command refuses to delete files that don't have the managed config header — safety against accidentally deleting hand-written configs
- `reload` always runs `nginx -t` first — never reloads with a broken config
- Config files live in a separate `apps.d/` directory and are included from the main nginx config via `include /etc/nginx/apps.d/*.conf;`
- Auth snippets are external files in the snippets directory — the tool only references them, doesn't create them
- WebSocket support sets 7-day timeouts for long-lived connections
- All operations are idempotent — safe to run multiple times
- `generateConfig()` is a pure function (deterministic, no side effects) — easy to test
