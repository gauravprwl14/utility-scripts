// Manual argv parser — no commander/yargs dependency
// Usage: const parsed = parseArgs(process.argv)
//
// Handles:
//   nginx-manager <command> [app-name] [port] [--flags]
//
// Positional args:
//   argv[2] → command
//   argv[3] → appName  (for add/remove/edit)
//   argv[4] → port     (for add, positional)
//
// Named options (--key value or --flag):
//   --path /foo        URL path prefix
//   --auth basic|ip|token
//   --port 3001        (edit: change port)
//   --websocket        boolean flag
//   --exact            boolean flag
//   --no-websocket     boolean flag (edit: disable ws)
//   --no-auth          boolean flag (edit: remove auth)

const VALUE_OPTIONS = new Set(['path', 'auth', 'port']);
const BOOL_FLAGS = new Set(['websocket', 'exact', 'no-websocket', 'no-auth']);

function parseArgs(argv) {
  const args = argv.slice(2); // drop 'node' and script path

  const result = {
    command: null,
    appName: null,
    port: null,
    options: {
      path: null,
      auth: null,
      port: null,         // --port option (edit only)
      websocket: false,
      exact: false,
      noWebsocket: false,
      noAuth: false,
    },
  };

  const positionals = [];
  let i = 0;

  while (i < args.length) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const flag = arg.slice(2);

      if (VALUE_OPTIONS.has(flag)) {
        i++;
        if (i < args.length) {
          // Camel-case the key: 'no-websocket' → 'noWebsocket'
          const key = toCamel(flag);
          result.options[key] = args[i];
        }
      } else if (BOOL_FLAGS.has(flag)) {
        const key = toCamel(flag);
        result.options[key] = true;
      }
      // Unknown flags are silently ignored
    } else {
      positionals.push(arg);
    }

    i++;
  }

  result.command = positionals[0] || null;
  result.appName = positionals[1] || null;

  // Positional port only applies to 'add' (3rd positional arg)
  if (positionals[2] !== undefined) {
    result.port = positionals[2];
  }

  return result;
}

function toCamel(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

module.exports = { parseArgs };
