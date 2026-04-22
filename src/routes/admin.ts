import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { CookieOptions } from 'hono/utils/cookie';
import { getAllArticlesAdmin } from '../lib/articles';
import type { AdminCommentSummary } from '../templates/admin';
import { renderLoginPage, renderDashboard } from '../templates/admin';

type Bindings = {
  ADMIN_PWD: string;
  DB: D1Database;
};

type AdminEnv = {
  Bindings: Bindings;
};

type CommentSchemaColumn = {
  name: string;
};

type CommentQueryRow = {
  id: number;
  slug: string;
  nickname: string;
  email: string;
  content: string;
  created_at: string;
  ip_address?: string | null;
  location_summary?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
};

const admin = new Hono<AdminEnv>();
const ADMIN_COOKIE_NAME = 'admin_token';
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24;
const RECENT_COMMENTS_LIMIT = 25;

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

function isSecureRequest(c: Context<AdminEnv>): boolean {
  const forwardedProto = c.req.header('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0].trim() === 'https';
  }
  return new URL(c.req.url).protocol === 'https:';
}

function getAuthCookieOptions(c: Context<AdminEnv>): CookieOptions {
  return {
    path: '/admin',
    httpOnly: true,
    secure: isSecureRequest(c),
    sameSite: 'Strict',
    maxAge: ADMIN_COOKIE_MAX_AGE,
  };
}

function loginNotice(message?: string): string | undefined {
  if (message === 'logged_out') {
    return 'Logged out successfully.';
  }
  return undefined;
}

function dashboardNotice(message?: string): string | undefined {
  if (message === 'comment_deleted') {
    return 'Comment deleted.';
  }
  return undefined;
}

function dashboardError(error?: string): string | undefined {
  if (error === 'comment_not_found') {
    return 'Comment not found or already removed.';
  }
  if (error === 'comment_delete_failed') {
    return 'Could not delete the comment. Please try again.';
  }
  return undefined;
}

function findAvailableColumn(columns: Set<string>, names: string[]): string | undefined {
  return names.find((name) => columns.has(name));
}

function buildLocationSummary(comment: CommentQueryRow): string | undefined {
  if (comment.location_summary?.trim()) {
    return comment.location_summary.trim();
  }

  const parts = [comment.city, comment.region, comment.country]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  if (parts.length === 0) {
    return undefined;
  }

  return parts.join(', ');
}

function stripSurroundingSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

async function getRecentComments(
  db: D1Database,
  articleTitleBySlug: Map<string, string>,
) {
  const { results: schemaResults } = await db
    .prepare('PRAGMA table_info(comments)')
    .all<CommentSchemaColumn>();

  const columns = new Set((schemaResults || []).map((column) => column.name));
  const selectColumns = [
    'id',
    'slug',
    'nickname',
    'email',
    'content',
    'created_at',
  ];

  const ipColumn = findAvailableColumn(columns, ['ip_address', 'ip', 'visitor_ip']);
  if (ipColumn) {
    selectColumns.push(`${ipColumn} AS ip_address`);
  }

  const locationSummaryColumn = findAvailableColumn(columns, [
    'location_summary',
    'location',
    'geo_summary',
  ]);
  if (locationSummaryColumn) {
    selectColumns.push(`${locationSummaryColumn} AS location_summary`);
  }

  const cityColumn = findAvailableColumn(columns, ['city']);
  if (cityColumn) {
    selectColumns.push(`${cityColumn} AS city`);
  }

  const regionColumn = findAvailableColumn(columns, ['region', 'region_name', 'province']);
  if (regionColumn) {
    selectColumns.push(`${regionColumn} AS region`);
  }

  const countryColumn = findAvailableColumn(columns, ['country', 'country_name', 'country_code']);
  if (countryColumn) {
    selectColumns.push(`${countryColumn} AS country`);
  }

  const { results } = await db
    .prepare(
      `SELECT ${selectColumns.join(', ')} FROM comments ORDER BY created_at DESC LIMIT ${RECENT_COMMENTS_LIMIT}`
    )
    .all<CommentQueryRow>();

  return (results || []).map((comment) => ({
    id: comment.id,
    slug: comment.slug,
    articleTitle: articleTitleBySlug.get(comment.slug) || stripSurroundingSlashes(comment.slug),
    nickname: comment.nickname,
    email: comment.email,
    content: comment.content,
    createdAt: comment.created_at,
    locationSummary: buildLocationSummary(comment),
    ipAddress: comment.ip_address?.trim() || undefined,
  }));
}

// Auth middleware
async function requireAuth(c: Context<AdminEnv>, next: Next) {
  const token = getCookie(c, ADMIN_COOKIE_NAME);
  const expectedToken = makeToken(c.env.ADMIN_PWD);
  if (token !== expectedToken) {
    return c.redirect('/admin');
  }
  await next();
}

// Login page
admin.get('/', (c) => {
  const token = getCookie(c, ADMIN_COOKIE_NAME);
  const expectedToken = makeToken(c.env.ADMIN_PWD);
  if (token === expectedToken) {
    return c.redirect('/admin/dashboard');
  }
  return c.html(renderLoginPage(undefined, loginNotice(c.req.query('message'))));
});

// Login action
admin.post('/login', async (c) => {
  const body = await c.req.parseBody();
  const password = body['password'] as string;

  if (password === c.env.ADMIN_PWD) {
    const token = makeToken(c.env.ADMIN_PWD);
    setCookie(c, ADMIN_COOKIE_NAME, token, getAuthCookieOptions(c));
    return c.redirect('/admin/dashboard');
  }

  return c.html(renderLoginPage('Invalid password'));
});

admin.post('/logout', (c) => {
  deleteCookie(c, ADMIN_COOKIE_NAME, getAuthCookieOptions(c));
  return c.redirect('/admin?message=logged_out');
});

admin.post('/comments/delete', requireAuth, async (c) => {
  const body = await c.req.parseBody();
  const commentIdValue = body['commentId'];
  const commentId = typeof commentIdValue === 'string' ? Number(commentIdValue) : NaN;

  if (!Number.isInteger(commentId) || commentId <= 0) {
    return c.redirect('/admin/dashboard?error=comment_delete_failed');
  }

  try {
    const deleted = await c.env.DB.prepare(
      'DELETE FROM comments WHERE id = ? RETURNING id'
    )
      .bind(commentId)
      .first<{ id: number }>();

    if (!deleted) {
      return c.redirect('/admin/dashboard?error=comment_not_found');
    }

    return c.redirect('/admin/dashboard?message=comment_deleted');
  } catch {
    return c.redirect('/admin/dashboard?error=comment_delete_failed');
  }
});

// Dashboard — read-only view of articles plus recent comment moderation
admin.get('/dashboard', requireAuth, async (c) => {
  const articles = getAllArticlesAdmin();
  const articleTitleBySlug = new Map<string, string>();
  articles.forEach((article) => {
    articleTitleBySlug.set(article.slug, article.title);
    articleTitleBySlug.set(`/${article.slug}/`, article.title);
  });

  let recentComments: AdminCommentSummary[] = [];
  let commentsError: string | undefined;

  try {
    recentComments = await getRecentComments(c.env.DB, articleTitleBySlug);
  } catch {
    commentsError = 'Recent comments are temporarily unavailable.';
  }

  return c.html(
    renderDashboard(
      articles,
      recentComments,
      dashboardNotice(c.req.query('message')),
      dashboardError(c.req.query('error')) || commentsError,
    )
  );
});

export default admin;
