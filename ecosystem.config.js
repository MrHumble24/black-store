const fs = require("fs");
const path = require("path");

/** Read apps/client/.env for CLIENT_PORT (PM2 static serve has no Vite env loader). */
function readClientPort() {
  const envPath = path.join(__dirname, "apps/client/.env");
  try {
    const text = fs.readFileSync(envPath, "utf8");
    const match = text.match(/^\s*CLIENT_PORT\s*=\s*(\d+)/m);
    if (match) return parseInt(match[1], 10);
  } catch {
    /* no file */
  }
  return 5173;
}

const clientPort = readClientPort();

module.exports = {
  apps: [
    {
      name: "black-store-api",
      cwd: "./apps/api",
      script: "./dist/main.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "black-store-client",
      script: "serve",
      env: {
        PM2_SERVE_PATH: "./apps/client/dist",
        PM2_SERVE_PORT: clientPort,
        PM2_SERVE_SPA: "true",
        PM2_SERVE_HOMEPAGE: "/index.html",
      },
    },
  ],
};
