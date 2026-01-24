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
        PM2_SERVE_PORT: 5173,
        PM2_SERVE_SPA: "true",
        PM2_SERVE_HOMEPAGE: "/index.html",
      },
    },
  ],
};
