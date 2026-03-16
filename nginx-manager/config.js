// Configuration for nginx-manager
// Priority: ENV variables > defaults
// Load dotenv in the entry point (bin/nginx-manager.js) before calling getConfig()

const CONFIG = {
  appsDir:    process.env.NGINX_APPS_DIR  || '/etc/nginx/apps.d',
  prefix:     process.env.NGINX_PREFIX    || 'rnd',
  domain:     process.env.NGINX_DOMAIN    || 'rnd.blr0.geekydev.com',
  snippetDir: process.env.NGINX_SNIPPETS  || '/etc/nginx/snippets',
};

function getConfig() {
  return { ...CONFIG };
}

module.exports = { getConfig };
