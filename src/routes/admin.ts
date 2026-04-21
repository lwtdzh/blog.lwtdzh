import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { getAllArticlesAdmin, getArticleBySlug, upsertArticle, deleteArticle, toggleHidden } from '../lib/articles';
import { renderLoginPage, renderDashboard, renderEditPage, renderNewPage } from '../templates/admin';

type Bindings = {
  DB: D1Database;
  ADMIN_PWD: string;
};

const admin = new Hono<{ Bindings: Bindings }>();

// Simple token generation
function makeToken(pwd: string): string {
  // Simple hash-like token from password
  let hash = 0;
  const str = pwd + '_blog_admin_token';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'admin_' + Math.abs(hash).toString(36);
}

// Auth middleware
async function requireAuth(c: any, next: any) {
  const token = getCookie(c, 'admin_token');
  const expectedToken = makeToken(c.env.ADMIN_PWD);
  if (token !== expectedToken) {
    return c.redirect('/admin');
  }
  await next();
}

// Login page
admin.get('/', (c) => {
  const token = getCookie(c, 'admin_token');
  const expectedToken = makeToken(c.env.ADMIN_PWD);
  if (token === expectedToken) {
    return c.redirect('/admin/dashboard');
  }
  return c.html(renderLoginPage());
});

// Login action
admin.post('/login', async (c) => {
  const body = await c.req.parseBody();
  const password = body['password'] as string;

  if (password === c.env.ADMIN_PWD) {
    const token = makeToken(c.env.ADMIN_PWD);
    setCookie(c, 'admin_token', token, {
      path: '/admin',
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 60 * 60 * 24, // 24 hours
    });
    return c.redirect('/admin/dashboard');
  }

  return c.html(renderLoginPage('Invalid password'));
});

// Dashboard
admin.get('/dashboard', requireAuth, async (c) => {
  const db = c.env.DB;
  const articles = await getAllArticlesAdmin(db);
  return c.html(renderDashboard(articles));
});

// New article form
admin.get('/articles/new', requireAuth, (c) => {
  return c.html(renderNewPage());
});

// Create article
admin.post('/articles', requireAuth, async (c) => {
  const db = c.env.DB;
  const body = await c.req.parseBody();

  const title = body['title'] as string;
  const slug = body['slug'] as string;
  const date = body['date'] as string;
  const tagsStr = body['tags'] as string;
  const cover = body['cover'] as string || '';
  const description = body['description'] as string || '';
  const content = body['content'] as string || '';

  if (!title || !slug || !date) {
    return c.text('Missing required fields', 400);
  }

  await upsertArticle(db, {
    slug,
    title,
    date,
    updated: date,
    description,
    tags: tagsStr || '[]',
    cover,
    content,
    hidden: 0,
  });

  return c.redirect('/admin/dashboard');
});

// Edit article form
admin.get('/articles/:id/edit', requireAuth, async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));

  // Get article by id
  const row = await db.prepare(
    'SELECT id, slug, title, date, updated, description, tags, cover, content, hidden FROM articles WHERE id = ?'
  ).bind(id).first();

  if (!row) {
    return c.text('Article not found', 404);
  }

  const article = {
    id: row.id as number,
    slug: row.slug as string,
    title: row.title as string,
    date: row.date as string,
    updated: (row.updated || row.date) as string,
    description: (row.description || '') as string,
    tags: (() => { try { return JSON.parse(row.tags as string); } catch { return []; } })(),
    cover: (row.cover || '') as string,
    hidden: (row.hidden || 0) as number,
    content: (row.content || '') as string,
  };

  return c.html(renderEditPage(article));
});

// Update article
admin.post('/articles/:id', requireAuth, async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const body = await c.req.parseBody();

  const title = body['title'] as string;
  const slug = body['slug'] as string;
  const date = body['date'] as string;
  const tagsStr = body['tags'] as string;
  const cover = body['cover'] as string || '';
  const description = body['description'] as string || '';
  const content = body['content'] as string || '';

  if (!title || !slug || !date) {
    return c.text('Missing required fields', 400);
  }

  // Update by id
  await db.prepare(`
    UPDATE articles SET slug = ?, title = ?, date = ?, updated = ?, description = ?, tags = ?, cover = ?, content = ?
    WHERE id = ?
  `).bind(slug, title, date, new Date().toISOString(), description, tagsStr || '[]', cover, content, id).run();

  return c.redirect('/admin/dashboard');
});

// Toggle hidden
admin.post('/articles/:id/toggle-hidden', requireAuth, async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  await toggleHidden(db, id);
  return c.redirect('/admin/dashboard');
});

// Delete article
admin.post('/articles/:id/delete', requireAuth, async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  await deleteArticle(db, id);
  return c.redirect('/admin/dashboard');
});

export default admin;
