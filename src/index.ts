import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-pages';
import pages from './routes/pages';
import api from './routes/api';
import admin from './routes/admin';
import sitemap from './routes/sitemap';
import { initDB } from './lib/articles';

type Bindings = {
  DB: D1Database;
  ADMIN_PWD: string;
  GITHUB_TOKEN?: string;
  CLOUDFLARE_DEPLOY_HOOK?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Initialize DB tables (visitors + comments only) on first request
app.use('*', async (c, next) => {
  try {
    await initDB(c.env.DB);
  } catch {
    // Tables already exist, safe to continue
  }
  await next();
});

// Serve static assets from /public
app.use('/css/*', serveStatic());
app.use('/js/*', serveStatic());
app.use('/lib/*', serveStatic());
app.use('/images/*', serveStatic());

// SEO verification files
app.use('/BingSiteAuth.xml', serveStatic());
app.use('/baidu_verify_codeva-e28AqD3F1C.html', serveStatic());
app.use('/c2edb372d7b10e234b60e653d79e17aa.txt', serveStatic());
app.use('/shenma-site-verification.txt', serveStatic());
app.use('/sogousiteverification.txt', serveStatic());
app.use('/yandex_79fe231b6ca5daaf.html', serveStatic());

// API routes
app.route('/api', api);

// Admin routes
app.route('/admin', admin);

// Sitemap & robots
app.route('/', sitemap);

// Page routes (must be last — catch-all patterns)
app.route('/', pages);

export default app;
