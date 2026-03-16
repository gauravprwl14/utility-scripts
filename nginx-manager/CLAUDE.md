# CLAUDE.md — nginx-manager

Node.js CLI for managing Nginx path-based reverse proxy routes. Add/edit/remove/list location blocks with support for WebSocket proxying, auth snippets (basic/IP/token), and exact path matching. Each route is a self-contained .conf file with a machine-readable metadata header.

**Stack**: Node.js, dotenv, zero other deps | **Entry**: `sudo node bin/nginx-manager.js <command>`
