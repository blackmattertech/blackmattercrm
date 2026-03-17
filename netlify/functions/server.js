/**
 * Netlify Function: runs the Express API (backend) as serverless.
 * Requests to /api/* and /health are redirected here by netlify.toml.
 */
const serverless = require('serverless-http');

let appPromise;

async function getApp() {
  if (!appPromise) {
    const mod = await import('../../backend/dist/index.js');
    appPromise = mod.app;
  }
  return appPromise;
}

exports.handler = async (event, context) => {
  const app = await getApp();
  const handler = serverless(app);
  return handler(event, context);
};
