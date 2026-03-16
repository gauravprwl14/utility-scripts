// Command: nginx-manager reload
// Runs "nginx -t" first; if the config is valid, reloads nginx.
// Requires sudo.

const { testConfig, reloadNginx } = require('../nginx/nginx-runner');

function reload() {
  console.log('Testing nginx configuration...');
  const testResult = testConfig();

  if (!testResult.success) {
    console.error('nginx config test FAILED:');
    console.error(testResult.output);
    process.exit(1);
  }

  console.log('Config test passed.');
  console.log('Reloading nginx...');

  const reloadResult = reloadNginx();
  if (!reloadResult.success) {
    console.error('nginx reload FAILED:');
    console.error(reloadResult.output);
    process.exit(1);
  }

  console.log('nginx reloaded successfully.');
}

module.exports = reload;
