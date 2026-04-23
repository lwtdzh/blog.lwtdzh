import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { CookieOptions } from 'hono/utils/cookie';
import { getAllArticlesAdmin } from '../lib/articles';
import {
  chooseArticleFilePath,
  formatArticleTimestamp,
  normalizeArticleSlug,
  normalizeArticleTags,
  parseDatetimeLocalValue,
  toDatetimeLocalValue,
  type ParsedArticleFile,
} from '../lib/article-files';
import {
  isDeployHookConfigured,
  triggerDeployHook,
} from '../lib/cloudflare-deploy-hook';
import {
  createGitHubArticleFile,
  deleteGitHubArticleFile,
  getGitHubArticleFile,
  isGitHubConfigured,
  listGitHubArticleFiles,
  updateGitHubArticleFile,
} from '../lib/github-content';
import type {
  AdminArticleEditorValue,
  AdminArticleSummary,
  AdminCommentSummary,
} from '../templates/admin';
import {
  renderArticleEditorPage,
  renderDashboard,
  renderLoginPage,
} from '../templates/admin';

type Bindings = {
  ADMIN_PWD: string;
  DB: D1Database;
  GITHUB_TOKEN?: string;
  CLOUDFLARE_DEPLOY_HOOK?: string;
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

type ParsedBody = Record<string, string | File>;

type LoadedArticles = {
  articles: AdminArticleSummary[];
  githubBacked: boolean;
  warning?: string;
};

const admin = new Hono<AdminEnv>();
const ADMIN_COOKIE_NAME = 'admin_token';
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24;
const RECENT_COMMENTS_LIMIT = 25;

function makeToken(pwd: string): string {
  let hash = 0;
  const str = pwd + '_blog_admin_token';
  for (let i = 0; i < str.length; i += 1) {
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
  if (message === 'article_deleted') {
    return 'Article deleted from GitHub.';
  }
  if (message === 'deploy_triggered') {
    return 'Cloudflare deploy triggered for the latest main branch.';
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
  if (error === 'github_not_configured') {
    return 'GitHub article editing is not configured. Set the GITHUB_TOKEN Pages secret.';
  }
  if (error === 'article_load_failed') {
    return 'Could not load the requested article from GitHub.';
  }
  if (error === 'article_delete_failed') {
    return 'Could not delete the article from GitHub. Please try again.';
  }
  if (error === 'deploy_hook_not_configured') {
    return 'Cloudflare deploy is not configured. Set the CLOUDFLARE_DEPLOY_HOOK Pages secret.';
  }
  if (error === 'deploy_hook_failed') {
    return 'Triggering the Cloudflare deploy hook failed. Check the hook URL and Pages build settings.';
  }
  return undefined;
}

function editorNotice(message?: string): string | undefined {
  if (message === 'article_created') {
    return 'Article created in GitHub.';
  }
  if (message === 'article_saved') {
    return 'Article updated in GitHub.';
  }
  if (message === 'deploy_triggered') {
    return 'Cloudflare deploy triggered for the latest main branch.';
  }
  return undefined;
}

function editorError(error?: string): string | undefined {
  if (error === 'github_not_configured') {
    return 'GitHub article editing is not configured. Set the GITHUB_TOKEN Pages secret.';
  }
  if (error === 'article_load_failed') {
    return 'Could not load the requested article from GitHub.';
  }
  if (error === 'deploy_hook_not_configured') {
    return 'Cloudflare deploy is not configured. Set the CLOUDFLARE_DEPLOY_HOOK Pages secret.';
  }
  if (error === 'deploy_hook_failed') {
    return 'Triggering the Cloudflare deploy hook failed. Check the hook URL and Pages build settings.';
  }
  return undefined;
}

function combineMessages(...messages: Array<string | undefined>): string | undefined {
  const parts = messages.filter(Boolean) as string[];
  if (parts.length === 0) {
    return undefined;
  }
  return parts.join(' ');
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

function bodyValue(body: ParsedBody, key: string): string {
  const value = body[key];
  return typeof value === 'string' ? value : '';
}

function buildAdminRedirect(
  path: string,
  params: Record<string, string | undefined>,
): string {
  const url = new URL(path, 'https://admin.local');

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return `${url.pathname}${url.search}`;
}

function normalizeAdminReturnTo(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed || !trimmed.startsWith('/admin')) {
    return fallback;
  }
  return trimmed;
}

function toFallbackArticleSummary(): AdminArticleSummary[] {
  return getAllArticlesAdmin().map((article) => ({ ...article }));
}

function toAdminArticleSummary(
  article: Awaited<ReturnType<typeof listGitHubArticleFiles>>[number],
  index: number,
): AdminArticleSummary {
  return {
    id: index,
    slug: article.data.slug,
    title: article.data.title,
    date: article.data.date,
    updated: article.data.updated || article.data.date,
    description: article.data.description || '',
    tags: article.data.tags || [],
    cover: article.data.cover || '',
    hidden: Boolean(article.data.hidden),
    sourcePath: article.sourcePath,
  };
}

async function loadDashboardArticles(env: Bindings): Promise<LoadedArticles> {
  if (!isGitHubConfigured(env)) {
    return {
      articles: toFallbackArticleSummary(),
      githubBacked: false,
      warning: 'GitHub article editing is not configured. Showing bundled article data only.',
    };
  }

  try {
    const files = await listGitHubArticleFiles(env);
    return {
      articles: files.map((article, index) => toAdminArticleSummary(article, index)),
      githubBacked: true,
    };
  } catch (error: any) {
    return {
      articles: toFallbackArticleSummary(),
      githubBacked: false,
      warning: error?.message
        ? `GitHub article loading failed: ${error.message}. Showing bundled article data only.`
        : 'GitHub article loading failed. Showing bundled article data only.',
    };
  }
}

async function getRecentComments(
  db: D1Database,
  articleTitleBySlug: Map<string, string>,
): Promise<AdminCommentSummary[]> {
  const { results: schemaResults } = await db
    .prepare('PRAGMA table_info(comments)')
    .all<CommentSchemaColumn>();

  const columns = new Set((schemaResults || []).map((column) => column.name));
  const selectColumns = ['id', 'slug', 'nickname', 'email', 'content', 'created_at'];

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
      `SELECT ${selectColumns.join(', ')} FROM comments ORDER BY created_at DESC LIMIT ${RECENT_COMMENTS_LIMIT}`,
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

function blankEditorValue(): AdminArticleEditorValue {
  return {
    title: '',
    dateValue: toDatetimeLocalValue(formatArticleTimestamp()),
    slug: '',
    tags: '',
    description: '',
    cover: '',
    hidden: false,
    body: '',
    isNew: true,
  };
}

function toEditorValue(
  body: ParsedBody,
  sourcePath?: string,
): AdminArticleEditorValue {
  return {
    sourcePath: sourcePath || bodyValue(body, 'sourcePath') || undefined,
    title: bodyValue(body, 'title'),
    dateValue: bodyValue(body, 'date'),
    slug: normalizeArticleSlug(bodyValue(body, 'slug')),
    tags: bodyValue(body, 'tags'),
    description: bodyValue(body, 'description'),
    cover: bodyValue(body, 'cover'),
    hidden: bodyValue(body, 'hidden') === 'on' || bodyValue(body, 'hidden') === 'true',
    body: bodyValue(body, 'body'),
    isNew: !sourcePath && !bodyValue(body, 'sourcePath'),
  };
}

function fromGitHubArticleToEditorValue(
  article: Awaited<ReturnType<typeof getGitHubArticleFile>>,
): AdminArticleEditorValue {
  return {
    sourcePath: article.sourcePath,
    title: article.data.title,
    dateValue: toDatetimeLocalValue(article.data.date),
    slug: article.data.slug,
    tags: (article.data.tags || []).join(', '),
    description: article.data.description || '',
    cover: article.data.cover || '',
    hidden: Boolean(article.data.hidden),
    body: article.content,
    isNew: false,
  };
}

function validateEditorValue(article: AdminArticleEditorValue): string | undefined {
  if (!article.title.trim()) {
    return 'Title is required.';
  }
  if (!article.dateValue.trim()) {
    return 'Published date is required.';
  }
  if (!article.slug.trim()) {
    return 'Slug is required.';
  }
  if (!article.body.trim()) {
    return 'Markdown body is required.';
  }
  if (!parseDatetimeLocalValue(article.dateValue)) {
    return 'Published date must be a valid date and time.';
  }
  return undefined;
}

function toParsedArticleFile(article: AdminArticleEditorValue): ParsedArticleFile {
  const parsedDate = parseDatetimeLocalValue(article.dateValue);
  if (!parsedDate) {
    throw new Error('Published date must be a valid date and time.');
  }

  return {
    data: {
      title: article.title.trim(),
      date: parsedDate,
      updated: formatArticleTimestamp(),
      slug: normalizeArticleSlug(article.slug),
      tags: normalizeArticleTags(article.tags),
      description: article.description.trim(),
      cover: article.cover.trim(),
      hidden: article.hidden,
    },
    content: article.body.trim(),
  };
}

async function requireGitHubConfigured(
  c: Context<AdminEnv>,
): Promise<Response | undefined> {
  if (!isGitHubConfigured(c.env)) {
    return c.redirect('/admin/dashboard?error=github_not_configured');
  }
  return undefined;
}

async function requireAuth(c: Context<AdminEnv>, next: Next) {
  const token = getCookie(c, ADMIN_COOKIE_NAME);
  const expectedToken = makeToken(c.env.ADMIN_PWD);
  if (token !== expectedToken) {
    return c.redirect('/admin');
  }
  await next();
}

admin.get('/', (c) => {
  const token = getCookie(c, ADMIN_COOKIE_NAME);
  const expectedToken = makeToken(c.env.ADMIN_PWD);
  if (token === expectedToken) {
    return c.redirect('/admin/dashboard');
  }
  return c.html(renderLoginPage(undefined, loginNotice(c.req.query('message'))));
});

admin.post('/login', async (c) => {
  const body = await c.req.parseBody();
  const password = bodyValue(body as ParsedBody, 'password');

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

admin.post('/deploy', requireAuth, async (c) => {
  const body = await c.req.parseBody();
  const returnTo = normalizeAdminReturnTo(
    bodyValue(body as ParsedBody, 'returnTo'),
    '/admin/dashboard',
  );

  if (!isDeployHookConfigured(c.env)) {
    return c.redirect(
      buildAdminRedirect(returnTo, { error: 'deploy_hook_not_configured' }),
    );
  }

  try {
    await triggerDeployHook(c.env);
    return c.redirect(buildAdminRedirect(returnTo, { message: 'deploy_triggered' }));
  } catch {
    return c.redirect(buildAdminRedirect(returnTo, { error: 'deploy_hook_failed' }));
  }
});

admin.post('/comments/delete', requireAuth, async (c) => {
  const body = await c.req.parseBody();
  const commentIdValue = bodyValue(body as ParsedBody, 'commentId');
  const commentId = Number(commentIdValue);

  if (!Number.isInteger(commentId) || commentId <= 0) {
    return c.redirect('/admin/dashboard?error=comment_delete_failed');
  }

  try {
    const deleted = await c.env.DB.prepare(
      'DELETE FROM comments WHERE id = ? RETURNING id',
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

admin.get('/dashboard', requireAuth, async (c) => {
  const loadedArticles = await loadDashboardArticles(c.env);
  const articleTitleBySlug = new Map<string, string>();
  loadedArticles.articles.forEach((article) => {
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

  const error = combineMessages(
    dashboardError(c.req.query('error')),
    commentsError,
    loadedArticles.warning,
  );

  return c.html(
    renderDashboard(
      loadedArticles.articles,
      recentComments,
      dashboardNotice(c.req.query('message')),
      error,
      { githubBacked: loadedArticles.githubBacked },
    ),
  );
});

admin.get('/articles/new', requireAuth, async (c) => {
  const configRedirect = await requireGitHubConfigured(c);
  if (configRedirect) {
    return configRedirect;
  }

  return c.html(
    renderArticleEditorPage(
      blankEditorValue(),
      editorNotice(c.req.query('message')),
      editorError(c.req.query('error')),
    ),
  );
});

admin.get('/articles/edit', requireAuth, async (c) => {
  const configRedirect = await requireGitHubConfigured(c);
  if (configRedirect) {
    return configRedirect;
  }

  const sourcePath = c.req.query('path');
  if (!sourcePath) {
    return c.redirect('/admin/dashboard?error=article_load_failed');
  }

  try {
    const article = await getGitHubArticleFile(c.env, sourcePath);
    return c.html(
      renderArticleEditorPage(
        fromGitHubArticleToEditorValue(article),
        editorNotice(c.req.query('message')),
        editorError(c.req.query('error')),
      ),
    );
  } catch {
    return c.redirect('/admin/dashboard?error=article_load_failed');
  }
});

admin.post('/articles/save', requireAuth, async (c) => {
  const configRedirect = await requireGitHubConfigured(c);
  if (configRedirect) {
    return configRedirect;
  }

  const body = await c.req.parseBody();
  const editorValue = toEditorValue(body as ParsedBody);
  const validationError = validateEditorValue(editorValue);

  if (validationError) {
    return c.html(renderArticleEditorPage(editorValue, undefined, validationError), 400);
  }

  try {
    const articleFile = toParsedArticleFile(editorValue);

    if (editorValue.sourcePath) {
      const currentArticle = await getGitHubArticleFile(c.env, editorValue.sourcePath);
      const savedArticle = await updateGitHubArticleFile(
        c.env,
        editorValue.sourcePath,
        articleFile,
        editorValue.title.trim(),
        currentArticle.sha,
      );

      return c.redirect(
        buildAdminRedirect(
          '/admin/articles/edit',
          {
            message: 'article_saved',
            path: savedArticle.sourcePath,
          },
        ),
      );
    }

    const existingPaths = (await listGitHubArticleFiles(c.env)).map(
      (article) => article.sourcePath,
    );
    const sourcePath = chooseArticleFilePath(articleFile.data.slug, existingPaths);
    const createdArticle = await createGitHubArticleFile(
      c.env,
      sourcePath,
      articleFile,
      editorValue.title.trim(),
    );

    return c.redirect(
      buildAdminRedirect(
        '/admin/articles/edit',
        {
          message: 'article_created',
          path: createdArticle.sourcePath,
        },
      ),
    );
  } catch (error: any) {
    return c.html(
      renderArticleEditorPage(
        editorValue,
        undefined,
        error?.message || 'Could not save the article to GitHub.',
      ),
      500,
    );
  }
});

admin.post('/articles/delete', requireAuth, async (c) => {
  const configRedirect = await requireGitHubConfigured(c);
  if (configRedirect) {
    return configRedirect;
  }

  const body = await c.req.parseBody();
  const sourcePath = bodyValue(body as ParsedBody, 'sourcePath');
  const title = bodyValue(body as ParsedBody, 'title');

  if (!sourcePath) {
    return c.redirect('/admin/dashboard?error=article_delete_failed');
  }

  try {
    const currentArticle = await getGitHubArticleFile(c.env, sourcePath);
    await deleteGitHubArticleFile(
      c.env,
      sourcePath,
      title || currentArticle.data.title,
      currentArticle.sha,
    );
    return c.redirect(buildAdminRedirect('/admin/dashboard', { message: 'article_deleted' }));
  } catch {
    return c.redirect('/admin/dashboard?error=article_delete_failed');
  }
});

export default admin;
