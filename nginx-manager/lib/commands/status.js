// Command: nginx-manager status
// Prints the systemctl status of the nginx service.
// Does not require sudo.

const { statusNginx } = require('../nginx/nginx-runner');

function status() {
  statusNginx();
}

module.exports = status;
