# nginx-manager

CLI tool for managing Nginx path-based proxy routes on `rnd.blr0.geekydev.com`.

Automates creating, listing, editing, and removing `location` blocks in `/etc/nginx/apps.d/`, replacing manual file editing with simple commands.

---

## Table of contents

- [How it works](#how-it-works)
- [Quick start](#quick-start)
- [Installation](#installation)
- [Commands](#commands)
  - [add](#add-app-name-port)
  - [list](#list)
  - [edit](#edit-app-name)
  - [remove](#remove-app-name)
  - [reload](#reload)
  - [status](#status)
- [Generated config format](#generated-config-format)
- [Common workflows](#common-workflows)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## How it works

The main nginx server block for `rnd.blr0.geekydev.com` includes all files matching `/etc/nginx/apps.d/rnd-*.conf` via a wildcard:

```nginx
# /etc/nginx/sites-enabled/rnd.blr0.geekydev.com
server {
    server_name rnd.blr0.geekydev.com;
    ...
    include /etc/nginx/apps.d/rnd-*.conf;
}
```

`nginx-manager` writes one `.conf` file per app into that directory. Every generated file starts with a machine-readable comment header — that header is the only "registry": when you run `list` or `edit`, the tool reads the metadata back from the files themselves, no database needed.

```
Public request                   nginx               Your app
─────────────────────────────────────────────────────────────
https://rnd.blr0.geekydev.com
  /my-app/...     ──────────►  location /my-app  ──►  localhost:3000
  /api/...        ──────────►  location /api      ──►  localhost:8080
  /ws-app/...     ──────────►  location /ws-app   ──►  localhost:4000
```

---

## Quick start

```bash
cd nginx-manager
npm install

# Add your first route (writes /etc/nginx/apps.d/rnd-my-app.conf)
sudo node bin/nginx-manager.js add my-app 3000

# See all routes
node bin/nginx-manager.js list

# Apply to nginx
sudo node bin/nginx-manager.js reload
```

---

## Installation

```bash
cd nginx-manager
npm install
```

### Optional: install globally

Make `nginx-manager` available anywhere on the server:

```bash
chmod +x bin/nginx-manager.js
sudo ln -s "$(pwd)/bin/nginx-manager.js" /usr/local/bin/nginx-manager
```

Then use it without the `node bin/` prefix:

```bash
sudo nginx-manager add my-app 3000
node nginx-manager list
```

### Environment overrides

Copy `.env.example` and adjust if your paths differ:

```bash
cp .env.example .env
```

---

## Commands

### `add <app-name> <port>`

Create a new proxy route. Writes `rnd-<app-name>.conf` to the apps directory.

```
sudo node bin/nginx-manager.js add <app-name> <port> [options]
```

**Options**

| Flag | Default | Description |
|---|---|---|
| `--path /custom-path` | `/<app-name>` | URL path prefix |
| `--auth basic\|ip\|token` | none | Auth snippet to include |
| `--websocket` | off | Add WebSocket headers + 7-day timeouts |
| `--exact` | off | Use `location = /path` (exact match) |

**Examples**

```bash
# Minimal — path defaults to /my-app
sudo node bin/nginx-manager.js add my-app 3000

# Custom path
sudo node bin/nginx-manager.js add backend 8080 --path /api

# With basic auth
sudo node bin/nginx-manager.js add dashboard 4000 --auth basic

# WebSocket app (dev server with HMR)
sudo node bin/nginx-manager.js add vite-app 5173 --websocket

# All options combined
sudo node bin/nginx-manager.js add studio 6000 --path /studio --auth token --websocket

# Exact-match landing page (won't match /my-app/sub-paths)
sudo node bin/nginx-manager.js add landing 7000 --path /landing --exact
```

**Sample output**

```
Created: /etc/nginx/apps.d/rnd-my-app.conf
Route:   https://rnd.blr0.geekydev.com/my-app  →  localhost:3000

Run "sudo nginx-manager reload" to apply changes.
```

---

### `list`

List all managed routes (reads metadata from file headers — no sudo needed).

```bash
node bin/nginx-manager.js list
```

**Sample output**

```
NAME                PORT    PATH                   AUTH      WS    EXACT
------------------------------------------------------------------------
backend             8080    /api                   none      no    no
dashboard           4000    /dashboard             basic     no    no
landing             7000    /landing               none      no    yes
studio              6000    /studio                token     yes   no
vite-app            5173    /vite-app              none      yes   no

5 route(s) in /etc/nginx/apps.d
```

---

### `edit <app-name>`

Edit an existing route. **Only the flags you pass are changed**; all other settings are preserved from the current file. The `created-at` timestamp is never updated.

```
sudo node bin/nginx-manager.js edit <app-name> [options]
```

**Options**

| Flag | Description |
|---|---|
| `--port <new-port>` | Change local port |
| `--path /new-path` | Change URL path |
| `--auth basic\|ip\|token` | Change auth type |
| `--no-auth` | Remove auth |
| `--websocket` | Enable WebSocket |
| `--no-websocket` | Disable WebSocket |
| `--exact` | Enable exact match |

**Examples**

```bash
# Change port only
sudo node bin/nginx-manager.js edit my-app --port 3001

# Switch auth type
sudo node bin/nginx-manager.js edit dashboard --auth ip

# Remove auth entirely
sudo node bin/nginx-manager.js edit dashboard --no-auth

# Add WebSocket support to an existing route
sudo node bin/nginx-manager.js edit backend --websocket

# Change multiple settings at once
sudo node bin/nginx-manager.js edit studio --port 6001 --no-auth --path /studio/v2
```

**Sample output**

```
Updated: /etc/nginx/apps.d/rnd-studio.conf
Route:   https://rnd.blr0.geekydev.com/studio/v2  →  localhost:6001

Run "sudo nginx-manager reload" to apply changes.
```

---

### `remove <app-name>`

Delete the managed config file for an app. Only removes files that have the managed header (won't touch manually created configs that match the naming pattern).

```bash
sudo node bin/nginx-manager.js remove my-app
```

**Sample output**

```
Removed: /etc/nginx/apps.d/rnd-my-app.conf

Run "sudo nginx-manager reload" to apply changes.
```

---

### `reload`

Run `nginx -t` to test the config, then `systemctl reload nginx` if the test passes. Always safe — nginx is never reloaded with a broken config.

```bash
sudo node bin/nginx-manager.js reload
```

**Sample output (success)**

```
Testing nginx configuration...
Config test passed.
Reloading nginx...
nginx reloaded successfully.
```

**Sample output (config error)**

```
Testing nginx configuration...
nginx config test FAILED:
nginx: [emerg] unknown directive "locaton" in /etc/nginx/apps.d/rnd-bad-app.conf:10
nginx: configuration file /etc/nginx/nginx.conf test failed
```

---

### `status`

Show the nginx service status (passes `systemctl status nginx` output directly to the terminal). No sudo needed.

```bash
node bin/nginx-manager.js status
```

**Sample output**

```
● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
     Active: active (running) since Sat 2026-02-22 10:00:00 UTC; 3h 12min ago
       Docs: man:nginx(8)
    Process: 1234 ExecStartPre=/usr/sbin/nginx -t -q -g daemon on; master_process on; (code=exited, status=0/SUCCESS)
   Main PID: 1235 (nginx)
      Tasks: 3 (limit: 4915)
     Memory: 6.4M
        CPU: 124ms
     CGroup: /system.slice/nginx.service
             ├─1235 "nginx: master process /usr/sbin/nginx -g daemon on; master_process on;"
             ├─1236 "nginx: worker process"
             └─1237 "nginx: worker process"
```

---

## Generated config format

Every managed file follows this format:

```nginx
# nginx-manager: managed config
# app-name: my-app
# port: 3000
# path: /my-app
# auth: none
# websocket: false
# exact: false
# created-at: 2026-02-22T10:00:00.000Z
# domain: rnd.blr0.geekydev.com

location /my-app {
    proxy_pass http://localhost:3000;
    include /etc/nginx/snippets/proxy-params.conf;
}
```

See [`docs/examples/`](docs/examples/) for a config file for each auth type and feature combination.

### With `--websocket`

Adds proxy headers and 7-day timeouts so long-lived connections (HMR, socket.io, etc.) don't get dropped:

```nginx
location /ws-app {
    proxy_pass http://localhost:5173;
    include /etc/nginx/snippets/proxy-params.conf;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;
}
```

### Auth snippets

| `--auth` value | Snippet included |
|---|---|
| `basic` | `security-basic-auth.conf` — HTTP Basic Auth prompt |
| `ip` | `security-ip-whitelist.conf` — IP allowlist |
| `token` | `security-token-header.conf` — Token header check |

### Exact match (`--exact`)

```nginx
location = /landing {   ← only matches exactly /landing, not /landing/anything
    proxy_pass http://localhost:7000;
    ...
}
```

---

## Common workflows

### Expose a new local dev server

```bash
# 1. Start your app on port 3000
npm run dev   # or whatever

# 2. Add a route
sudo node bin/nginx-manager.js add my-feature 3000

# 3. Apply to nginx
sudo node bin/nginx-manager.js reload

# 4. Visit https://rnd.blr0.geekydev.com/my-feature
```

---

### Add auth to a route that didn't have it

```bash
sudo node bin/nginx-manager.js edit my-feature --auth basic
sudo node bin/nginx-manager.js reload
```

---

### Dev server changed port (e.g. HMR port conflict)

```bash
sudo node bin/nginx-manager.js edit my-feature --port 3001
sudo node bin/nginx-manager.js reload
```

---

### Enable WebSocket for a Vite / Next.js dev server

```bash
sudo node bin/nginx-manager.js add vite 5173 --websocket
sudo node bin/nginx-manager.js reload
```

---

### Move a route to a cleaner path

```bash
sudo node bin/nginx-manager.js edit my-feature --path /feature
sudo node bin/nginx-manager.js reload
```

---

### Clean up when done with a feature

```bash
sudo node bin/nginx-manager.js remove my-feature
sudo node bin/nginx-manager.js reload
```

---

### Audit all active routes

```bash
node bin/nginx-manager.js list
```

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| `NGINX_APPS_DIR` | `/etc/nginx/apps.d` | Directory where app configs are stored |
| `NGINX_PREFIX` | `rnd` | Filename prefix (`rnd-myapp.conf`) |
| `NGINX_DOMAIN` | `rnd.blr0.geekydev.com` | Domain used in config comment headers |
| `NGINX_SNIPPETS` | `/etc/nginx/snippets` | Directory containing reusable snippet files |

All variables can be set in `.env` (copy from `.env.example`) or exported in the shell before running.

**Expected snippets in `NGINX_SNIPPETS`:**

| File | Purpose |
|---|---|
| `proxy-params.conf` | Always included — sets standard proxy headers |
| `security-basic-auth.conf` | HTTP Basic Auth |
| `security-ip-whitelist.conf` | IP allowlist |
| `security-token-header.conf` | Token header check |

---

## Sudo notes

| Command | Needs sudo? | Reason |
|---|---|---|
| `add` | yes | Writes to `/etc/nginx/apps.d/` |
| `edit` | yes | Writes to `/etc/nginx/apps.d/` |
| `remove` | yes | Deletes from `/etc/nginx/apps.d/` |
| `reload` | yes | Calls `systemctl reload nginx` |
| `list` | no | Read-only |
| `status` | no | Read-only |

If you forget sudo, the tool will print:

```
Error: Permission denied writing to: /etc/nginx/apps.d/rnd-my-app.conf
Try running with sudo
```

---

## Troubleshooting

**`list` shows nothing even though I added routes**

Check whether the files exist and use the right prefix:
```bash
ls /etc/nginx/apps.d/
```
If your `NGINX_PREFIX` env differs from the default (`rnd`), set it in `.env`.

---

**`reload` fails with a config error**

The error output from `nginx -t` will point to the exact file and line. Fix it manually or remove the bad route:
```bash
sudo node bin/nginx-manager.js remove bad-app
sudo node bin/nginx-manager.js reload
```

---

**`edit` says "No config found"**

The app name must match exactly (case-sensitive). Use `list` to see exact names:
```bash
node bin/nginx-manager.js list
```

---

**I manually edited a managed file and now `edit` gives wrong output**

The tool regenerates the file from the comment header metadata, not from the nginx directives themselves. If you hand-edited the directives without updating the header comments, use `edit` to re-sync, or edit the header comments to match your changes.
