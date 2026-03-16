// Wrappers around nginx and systemctl commands.
// The caller is expected to run with sufficient privileges (sudo).

const { execSync, spawnSync } = require('child_process');

/**
 * Run "nginx -t" to test the current nginx configuration.
 * @returns {{ success: boolean, output: string }}
 */
function testConfig() {
  try {
    const output = execSync('nginx -t 2>&1', { encoding: 'utf-8' });
    return { success: true, output };
  } catch (err) {
    const output = err.stdout || err.stderr || err.message || '';
    return { success: false, output: output.toString() };
  }
}

/**
 * Run "systemctl reload nginx".
 * Call testConfig() first to be safe.
 * @returns {{ success: boolean, output: string }}
 */
function reloadNginx() {
  try {
    execSync('systemctl reload nginx 2>&1', { encoding: 'utf-8' });
    return { success: true, output: '' };
  } catch (err) {
    const output = err.stdout || err.stderr || err.message || '';
    return { success: false, output: output.toString() };
  }
}

/**
 * Print "systemctl status nginx" output directly to the terminal.
 * systemctl exits non-zero for inactive/failed but still outputs useful info,
 * so we use spawnSync with stdio: 'inherit' and ignore the exit code.
 */
function statusNginx() {
  spawnSync('systemctl', ['status', 'nginx'], { stdio: 'inherit' });
}

module.exports = { testConfig, reloadNginx, statusNginx };
