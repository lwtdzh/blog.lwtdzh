import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { getAllArticlesAdmin, getArticleBySlug } from '../lib/articles';
import { renderLoginPage, renderDashboard } from '../templates/admin';

type Bindings = {
  ADMIN_PWD: string;
};

const admin = new Hono<{ Bindings: Bindings }>();

// Simple token generation
function makeToken(pwd: string): string {
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

// Dashboard — read-only view of all articles (managed via git/markdown files)
admin.get('/dashboard', requireAuth, (c) => {
  const articles = getAllArticlesAdmin();
  return c.html(renderDashboard(articles));
});

export default admin;
