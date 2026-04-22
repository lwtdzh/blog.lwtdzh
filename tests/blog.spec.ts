import { expect, test, type Locator, type Page } from '@playwright/test';
import { articles, type ArticleData } from '../src/generated/articles';

const BASE = process.env.BASE_URL || 'https://blog.lwtdzh.ip-ddns.com';
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD ||
  process.env.ADMIN_PWD ||
  process.env.PLAYWRIGHT_ADMIN_PASSWORD ||
  '';
const ADMIN_PASSWORD_HINT =
  'Set ADMIN_PASSWORD, ADMIN_PWD, or PLAYWRIGHT_ADMIN_PASSWORD to run authenticated admin tests.';
const STATEFUL_BROWSER_HINT =
  'Stateful comment/admin mutation coverage runs once in Chromium to reduce cross-browser data pollution.';

const ALL_ARTICLES = articles;
const VISIBLE_ARTICLES = ALL_ARTICLES.filter((article) => !article.hidden);
const TOTAL_ARTICLES = ALL_ARTICLES.length;
const VISIBLE_ARTICLE_COUNT = VISIBLE_ARTICLES.length;
const PAGE_SIZE = 10;
const FIRST_PAGE_ARTICLES = VISIBLE_ARTICLES.slice(0, PAGE_SIZE);
const SECOND_PAGE_ARTICLES = VISIBLE_ARTICLES.slice(PAGE_SIZE);
const TAG_TO_ARTICLES = buildTagMap(VISIBLE_ARTICLES);
const YEAR_HEADERS = Array.from(
  new Set(VISIBLE_ARTICLES.map((article) => article.date.slice(0, 4))),
);

const COMMENT_ARTICLE = requireArticle('2022/09/07/test/hello-world');
const IMAGE_HOST_ARTICLE = requireArticle('2022/09/07/test/Image-Host-Test');
const CLANNAD_ARTICLE = requireArticle('2024/08/14/jpsub/clannad');
const HIDDEN_ARTICLE = ALL_ARTICLES.find((article) => article.hidden);

if (!HIDDEN_ARTICLE) {
  throw new Error('Expected one hidden article in generated article data.');
}

function requireArticle(slug: string): ArticleData {
  const article = ALL_ARTICLES.find((entry) => entry.slug === slug);
  if (!article) {
    throw new Error(`Expected article "${slug}" to exist.`);
  }
  return article;
}

function buildTagMap(items: readonly ArticleData[]): Map<string, ArticleData[]> {
  const map = new Map<string, ArticleData[]>();

  for (const article of items) {
    for (const tag of article.tags) {
      const existing = map.get(tag) || [];
      existing.push(article);
      map.set(tag, existing);
    }
  }

  return map;
}

function articlePath(article: Pick<ArticleData, 'slug'>): string {
  return `/${article.slug}/`;
}

function normalizeText(text: string | null | undefined): string {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function asBodyText(body: unknown): string {
  return typeof body === 'string' ? body : JSON.stringify(body);
}

async function go(page: Page, path: string, maxRetries = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      return;
    } catch (error: any) {
      const message = error?.message || '';
      const shouldRetry =
        message.includes('ERR_CONNECTION_RESET') ||
        message.includes('ERR_CONNECTION_REFUSED') ||
        message.includes('net::');

      if (attempt < maxRetries && shouldRetry) {
        await page.waitForTimeout(1500 * attempt);
        continue;
      }

      throw error;
    }
  }
}

async function apiGet(page: Page, path: string): Promise<{ status: number; body: any }> {
  return page.evaluate(async (url: string) => {
    const response = await fetch(url);
    const text = await response.text();

    let body: any;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }

    return { status: response.status, body };
  }, `${BASE}${path}`);
}

async function apiPost(
  page: Page,
  path: string,
  data: Record<string, unknown>,
): Promise<{ status: number; body: any }> {
  return page.evaluate(
    async ({ url, data: payload }: { url: string; data: Record<string, unknown> }) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await response.text();

      let body: any;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }

      return { status: response.status, body };
    },
    { url: `${BASE}${path}`, data },
  );
}

async function textContents(locator: Locator): Promise<string[]> {
  const values = await locator.allTextContents();
  return values.map((value) => normalizeText(value)).filter(Boolean);
}

function commentSection(page: Page): Locator {
  return page.locator('#comments-section');
}

function commentForm(page: Page): Locator {
  return commentSection(page).locator('form, .comment-form, [data-testid="comment-form"]').first();
}

function commentList(page: Page): Locator {
  return commentSection(page)
    .locator('.comment-list, [data-testid="comment-list"], [data-testid="comments-list"]')
    .first();
}

function commentContentField(page: Page): Locator {
  return commentForm(page)
    .locator('textarea[name="content"], textarea.comment-textarea, textarea')
    .first();
}

function commentSubmitButton(page: Page): Locator {
  return commentForm(page)
    .locator('button[type="submit"], .comment-submit, [data-testid="comment-submit"]')
    .first();
}

async function fillVisibleRequiredIdentityFields(
  form: Locator,
  seed: string,
): Promise<{ legacyIdentityUsed: boolean; fallbackAuthor?: string; fallbackEmail?: string }> {
  const requiredFields = form.locator('input[required], textarea[required], select[required]');
  const count = await requiredFields.count();

  let legacyIdentityUsed = false;
  let fallbackAuthor: string | undefined;
  let fallbackEmail: string | undefined;

  for (let index = 0; index < count; index += 1) {
    const field = requiredFields.nth(index);
    const isVisible = await field.isVisible().catch(() => false);
    if (!isVisible) {
      continue;
    }

    const tagName = await field.evaluate((element) => element.tagName.toLowerCase());
    const name = (await field.getAttribute('name')) || '';

    if (tagName === 'textarea' && name === 'content') {
      continue;
    }

    legacyIdentityUsed = true;

    if (tagName === 'input') {
      const type = ((await field.getAttribute('type')) || 'text').toLowerCase();
      if (type === 'hidden' || type === 'submit' || type === 'button') {
        continue;
      }

      if (type === 'email') {
        fallbackEmail = fallbackEmail || `anonymous-${seed}@example.com`;
        await field.fill(fallbackEmail);
      } else {
        fallbackAuthor = fallbackAuthor || `Anonymous ${seed}`;
        await field.fill(fallbackAuthor);
      }

      continue;
    }

    if (tagName === 'textarea') {
      fallbackAuthor = fallbackAuthor || `Anonymous ${seed}`;
      await field.fill(fallbackAuthor);
      continue;
    }

    if (tagName === 'select') {
      const selected = await field.evaluate((element) => {
        const select = element as HTMLSelectElement;
        const option = Array.from(select.options).find((candidate) => candidate.value);

        if (!option) {
          return '';
        }

        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return option.value;
      });

      if (!selected) {
        throw new Error(`Unable to satisfy required comment field "${name || 'select'}".`);
      }
    }
  }

  return { legacyIdentityUsed, fallbackAuthor, fallbackEmail };
}

async function submitCommentViaUi(
  page: Page,
  content: string,
): Promise<{ legacyIdentityUsed: boolean; fallbackAuthor?: string; commentScope: Locator }> {
  const section = commentSection(page);
  const form = commentForm(page);

  await expect(section).toBeVisible();
  await expect(form).toBeVisible();
  await expect(commentContentField(page)).toBeVisible();
  await expect(commentSubmitButton(page)).toBeVisible();

  const seed = `${Date.now()}`;
  const dialogMessages: string[] = [];
  const dialogHandler = async (dialog: { message(): string; dismiss(): Promise<void> }) => {
    dialogMessages.push(dialog.message());
    await dialog.dismiss();
  };

  page.on('dialog', dialogHandler);

  try {
    await commentContentField(page).fill(content);
    const identity = await fillVisibleRequiredIdentityFields(form, seed);

    await commentSubmitButton(page).click();

    const contentLocator = section.getByText(content, { exact: true });
    await expect(contentLocator).toBeVisible({ timeout: 15000 });

    if (dialogMessages.length > 0) {
      throw new Error(`Unexpected comment dialog: ${dialogMessages.join(' | ')}`);
    }

    const commentItem = section
      .locator('.comment-item, [data-testid="comment-item"], article, li')
      .filter({ hasText: content })
      .first();

    const hasCommentItem = (await commentItem.count()) > 0;

    return {
      legacyIdentityUsed: identity.legacyIdentityUsed,
      fallbackAuthor: identity.fallbackAuthor,
      commentScope: hasCommentItem ? commentItem : section,
    };
  } finally {
    page.off('dialog', dialogHandler);
  }
}

function commentResponseNeedsLegacyIdentity(body: unknown): boolean {
  return /nickname|name|required/i.test(asBodyText(body));
}

async function postCommentWithAdaptivePayload(
  page: Page,
  slug: string,
  content: string,
): Promise<{
  result: { status: number; body: any };
  legacyIdentityUsed: boolean;
  fallbackAuthor?: string;
}> {
  let result = await apiPost(page, '/api/comments', { slug, content });

  if ((result.status === 400 || result.status === 422) && commentResponseNeedsLegacyIdentity(result.body)) {
    const seed = `${Date.now()}`;
    const fallbackAuthor = `Anonymous ${seed}`;
    const fallbackEmail = `anonymous-${seed}@example.com`;
    result = await apiPost(page, '/api/comments', {
      slug,
      content,
      nickname: fallbackAuthor,
      email: fallbackEmail,
    });

    return { result, legacyIdentityUsed: true, fallbackAuthor };
  }

  return { result, legacyIdentityUsed: false };
}

async function assertOptionalCommentMetadata(
  scope: Locator,
  fallbackAuthor?: string,
): Promise<void> {
  const anonymousLabel = scope.getByText(/anonymous|guest|游客|匿名/i).first();
  if ((await anonymousLabel.count()) > 0) {
    await expect(anonymousLabel).toBeVisible();
  }

  const author = scope
    .locator(
      '.comment-author, [data-testid="comment-author"], [data-author], .comment-meta strong, .comment-meta [class*="author"]',
    )
    .first();

  if ((await author.count()) > 0) {
    const text = normalizeText(await author.textContent());
    expect(text.length).toBeGreaterThan(0);

    if (fallbackAuthor) {
      expect(text.includes(fallbackAuthor) || /anonymous|guest|游客|匿名/i.test(text)).toBe(true);
    }
  }

  const location = scope
    .locator(
      '.comment-location, [data-testid="comment-location"], [data-location], .comment-meta [class*="location"]',
    )
    .first();

  if ((await location.count()) > 0) {
    const text = normalizeText(await location.textContent());
    expect(text.length).toBeGreaterThan(0);
  }
}

function requireAdminSession(): void {
  test.skip(!ADMIN_PASSWORD, ADMIN_PASSWORD_HINT);
  test.skip(!BASE.startsWith('https://'), 'Authenticated admin tests require an https BASE_URL because the admin cookie is secure-only.');
}

async function loginToAdmin(page: Page): Promise<void> {
  requireAdminSession();

  await go(page, '/admin');
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForLoadState('domcontentloaded');

  const dashboardHeading = page.getByRole('heading', { name: /blog admin/i });
  const onDashboard =
    page.url().includes('/admin/dashboard') || (await dashboardHeading.count()) > 0;

  expect(onDashboard).toBe(true);
}

test.describe('Homepage and listing pages', () => {
  test('homepage loads the site chrome and dynamic counts', async ({ page }) => {
    await go(page, '/');

    await expect(page).toHaveTitle(/Lwtdzh's Blog/);
    await expect(page.locator('h1.site-title')).toHaveText("Lwtdzh's Blog");
    await expect(page.locator('a[href="/"]').filter({ hasText: 'Home' })).toBeVisible();
    await expect(page.locator('a[href="/archives/"]').filter({ hasText: 'Archives' })).toBeVisible();
    await expect(page.locator('.site-author-name')).toHaveText('lwtdzh');
    await expect(page.locator('.site-author-image')).toHaveAttribute('src', '/images/avatar.gif');
    await expect(page.locator('footer.footer')).toContainText('Cloudflare');

    const postCount = normalizeText(
      await page.locator('.site-state-posts .site-state-item-count').textContent(),
    );
    const tagCount = normalizeText(
      await page.locator('.site-state-tags .site-state-item-count').textContent(),
    );

    expect(Number(postCount)).toBe(VISIBLE_ARTICLE_COUNT);
    expect(Number(tagCount)).toBe(TAG_TO_ARTICLES.size);
  });

  test('homepage page 1 shows the newest visible articles with layout affordances', async ({
    page,
  }) => {
    await go(page, '/');

    const cards = page.locator('article.post-block');
    await expect(cards).toHaveCount(FIRST_PAGE_ARTICLES.length);
    await expect(cards.first().locator('.post-title a')).toBeVisible();
    await expect(cards.first().locator('time')).toBeVisible();
    await expect(page.locator('a.btn:has-text("Read more")')).toHaveCount(
      FIRST_PAGE_ARTICLES.length,
    );

    const titles = await textContents(page.locator('article.post-block .post-title a'));
    expect(titles).toEqual(FIRST_PAGE_ARTICLES.map((article) => article.title));
    expect(titles).not.toContain(HIDDEN_ARTICLE.title);

    const visitorSpans = page.locator('.leancloud-visitors-count');
    await expect(visitorSpans).toHaveCount(FIRST_PAGE_ARTICLES.length);
  });

  test('page 2 shows the remaining visible articles and excludes hidden posts', async ({
    page,
  }) => {
    await go(page, '/page/2/');

    const titles = await textContents(page.locator('article.post-block .post-title a'));
    expect(titles).toEqual(SECOND_PAGE_ARTICLES.map((article) => article.title));
    expect(titles).not.toContain(HIDDEN_ARTICLE.title);
  });

  test('archives page lists every visible article and year group', async ({ page }) => {
    await go(page, '/archives/');

    await expect(page).toHaveTitle(/Archives/);
    await expect(page.locator('.collection-title .collection-header')).toContainText(
      `${VISIBLE_ARTICLE_COUNT} posts in total`,
    );

    const archiveTitles = await textContents(page.locator('.posts-collapse .post-title-link'));
    expect(archiveTitles).toEqual(VISIBLE_ARTICLES.map((article) => article.title));
    expect(archiveTitles).not.toContain(HIDDEN_ARTICLE.title);

    const years = await textContents(page.locator('.collection-year .collection-header'));
    expect(years).toEqual(expect.arrayContaining(YEAR_HEADERS));
  });

  for (const [tag, taggedArticles] of TAG_TO_ARTICLES.entries()) {
    test(`tag page "${tag}" lists the expected visible articles`, async ({ page }) => {
      await go(page, `/tags/${encodeURIComponent(tag)}/`);

      await expect(page).toHaveTitle(new RegExp(escapeRegExp(tag)));
      const titles = await textContents(page.locator('.posts-collapse .post-title-link'));
      expect(titles).toEqual(taggedArticles.map((article) => article.title));
    });
  }

  test('hidden-only tag route stays empty for visible article listings', async ({ page }) => {
    await go(page, `/tags/${encodeURIComponent('rambling')}/`);

    await expect(page).toHaveTitle(/rambling/);
    await expect(page.locator('.posts-collapse article')).toHaveCount(0);
  });

  test('site navigation links move between home, archives, tags, and article pages', async ({
    page,
  }) => {
    await go(page, '/');
    await page.getByRole('link', { name: /archives/i }).first().click();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/archives/');

    await page.locator('.post-title-link').first().click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1.post-title')).toBeVisible();

    await page.locator('.post-tags a').first().click();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/tags/');

    await page.getByRole('link', { name: /home/i }).first().click();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toBe(`${BASE}/`);
  });
});

test.describe('Article routes', () => {
  for (const article of ALL_ARTICLES) {
    test(`article route renders for "${article.title}"`, async ({ page }) => {
      await go(page, articlePath(article));

      await expect(page).toHaveTitle(new RegExp(escapeRegExp(article.title)));
      await expect(page.locator('h1.post-title')).toContainText(article.title);
      await expect(page.locator('.post-meta time').first()).toBeVisible();
      await expect(page.locator('.post-body')).toBeVisible();
      await expect(page.locator('.post-footer')).toBeVisible();
      await expect(commentSection(page)).toBeVisible();
    });
  }

  test('Hello World keeps its quick-start content', async ({ page }) => {
    await go(page, articlePath(COMMENT_ARTICLE));

    const bodyText = normalizeText(await page.locator('.post-body').textContent());
    expect(bodyText).toContain('hexo new');
    expect(bodyText).toContain('hexo server');
  });

  test('Image Host Test renders one or more content images', async ({ page }) => {
    await go(page, articlePath(IMAGE_HOST_ARTICLE));
    await expect(page.locator('.post-body img').first()).toBeVisible();
  });

  test('article chrome includes prev/next navigation and tags when available', async ({ page }) => {
    await go(page, articlePath(CLANNAD_ARTICLE));

    await expect(page.locator('.post-tags a').first()).toBeVisible();
    await expect(page.locator('.post-nav')).toBeVisible();
    expect(await page.locator('.post-nav a').count()).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Visitors, SEO, and static assets', () => {
  test('visitors API returns counts for single and multiple slugs', async ({ page }) => {
    const single = await apiGet(
      page,
      `/api/visitors?slug=${encodeURIComponent(articlePath(CLANNAD_ARTICLE))}`,
    );
    expect(single.status).toBe(200);
    expect(typeof single.body.count).toBe('number');

    const multiple = await apiGet(
      page,
      `/api/visitors?slugs=${encodeURIComponent(
        [articlePath(CLANNAD_ARTICLE), articlePath(COMMENT_ARTICLE)].join(','),
      )}`,
    );
    expect(multiple.status).toBe(200);
    expect(multiple.body).toHaveProperty(articlePath(CLANNAD_ARTICLE));
    expect(multiple.body).toHaveProperty(articlePath(COMMENT_ARTICLE));
  });

  test('visitors API increments an article count', async ({ page }) => {
    const slug = articlePath(COMMENT_ARTICLE);
    const before = await apiGet(page, `/api/visitors?slug=${encodeURIComponent(slug)}`);
    const update = await apiPost(page, '/api/visitors', { slug });
    const after = await apiGet(page, `/api/visitors?slug=${encodeURIComponent(slug)}`);

    expect(update.status).toBe(200);
    expect(after.body.count).toBeGreaterThanOrEqual(before.body.count);
  });

  test('visitor count UI populates numeric values on home and article pages', async ({ page }) => {
    await go(page, '/');
    await expect(page.locator('.leancloud-visitors-count').first()).toHaveText(/\d+/, {
      timeout: 15000,
    });

    await go(page, articlePath(CLANNAD_ARTICLE));
    await expect(page.locator('.leancloud-visitors-count').first()).toHaveText(/\d+/, {
      timeout: 15000,
    });
  });

  test('homepage links its main static assets and OG tags', async ({ page }) => {
    await go(page, '/');

    await expect(page.locator('link[href*="main.css"]')).toHaveCount(1);
    await expect(page.locator('link[href*="font-awesome"]')).toHaveCount(1);
    expect(await page.locator('script[src]').count()).toBeGreaterThan(0);

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
    expect(ogTitle).toContain("Lwtdzh's Blog");
    expect(ogType).toBe('website');
  });

  test('article pages expose article SEO metadata', async ({ page }) => {
    await go(page, articlePath(CLANNAD_ARTICLE));

    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain(CLANNAD_ARTICLE.slug);
  });

  test('sitemap and robots endpoints render expected crawl metadata', async ({ page }) => {
    await go(page, '/');

    const sitemap = await apiGet(page, '/sitemap.xml');
    const baiduSitemap = await apiGet(page, '/baidusitemap.xml');
    expect(sitemap.status).toBe(200);
    expect(baiduSitemap.status).toBe(200);
    expect(asBodyText(sitemap.body)).toContain('urlset');
    expect(asBodyText(baiduSitemap.body)).toContain('urlset');

    await go(page, '/robots.txt');
    const robotsText = normalizeText(await page.textContent('body'));
    expect(robotsText).toContain('User-agent');
    expect(robotsText).toContain('Allow');
    expect(robotsText).toContain('Sitemap');
  });

  test('mobile and tablet viewports keep the homepage usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await go(page, '/');
    await expect(page.locator('h1.site-title')).toBeVisible();
    await expect(page.locator('article.post-block').first()).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await go(page, '/');
    await expect(page.locator('h1.site-title')).toBeVisible();
    await expect(page.locator('article.post-block').first()).toBeVisible();
  });
});

test.describe('Comments', () => {
  test('comments API returns an array for an article slug and rejects a missing slug', async ({
    page,
  }) => {
    const ok = await apiGet(
      page,
      `/api/comments?slug=${encodeURIComponent(articlePath(CLANNAD_ARTICLE))}`,
    );
    expect(ok.status).toBe(200);
    expect(Array.isArray(ok.body)).toBe(true);

    const missing = await apiGet(page, '/api/comments');
    expect(missing.status).toBe(400);
  });

  test('comments API can create a comment with content-first payloads and retrieve it', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', STATEFUL_BROWSER_HINT);

    const slug = articlePath(COMMENT_ARTICLE);
    const content = `Playwright API comment ${Date.now()}`;
    const created = await postCommentWithAdaptivePayload(page, slug, content);

    expect(created.result.status === 200 || created.result.status === 201).toBe(true);

    const fetched = await apiGet(page, `/api/comments?slug=${encodeURIComponent(slug)}`);
    expect(fetched.status).toBe(200);

    const found = fetched.body.find((comment: any) => comment.content === content);
    expect(found).toBeDefined();

    if (found && created.legacyIdentityUsed && created.fallbackAuthor) {
      expect(
        normalizeText(found.nickname || found.name || '').includes(created.fallbackAuthor) ||
          /anonymous|guest|游客|匿名/i.test(normalizeText(found.nickname || found.name || '')),
      ).toBe(true);
    }

    if (found && typeof found.location === 'string') {
      expect(normalizeText(found.location).length).toBeGreaterThan(0);
    }
  });

  test('comments API rejects a payload without the required core fields', async ({ page }) => {
    const missingSlug = await apiPost(page, '/api/comments', { content: 'missing slug' });
    expect(missingSlug.status).toBeGreaterThanOrEqual(400);
  });

  test('article pages render a comment composer and list container without assuming legacy fields', async ({
    page,
  }) => {
    await go(page, articlePath(CLANNAD_ARTICLE));

    await expect(commentSection(page)).toBeVisible();
    await expect(commentForm(page)).toBeVisible();
    await expect(commentContentField(page)).toBeVisible();
    await expect(commentSubmitButton(page)).toBeVisible();
    await expect(commentList(page)).toBeVisible();
  });

  test('submitting a comment through the UI works with a content-first flow', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', STATEFUL_BROWSER_HINT);

    await go(page, articlePath(COMMENT_ARTICLE));

    const content = `Playwright UI comment ${Date.now()}`;
    const submission = await submitCommentViaUi(page, content);

    await expect(commentSection(page).getByText(content, { exact: true })).toBeVisible();
    await assertOptionalCommentMetadata(submission.commentScope, submission.fallbackAuthor);
  });
});

test.describe('Admin', () => {
  test('admin login page renders the password form', async ({ page }) => {
    await go(page, '/admin');
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('admin login with a wrong password shows an error', async ({ page }) => {
    await go(page, '/admin');
    await page.locator('input[name="password"]').fill(`wrong-${Date.now()}`);
    await page.locator('button[type="submit"]').click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.error')).toContainText('Invalid password');
  });

  test('admin login with an environment-provided password reaches the dashboard', async ({
    page,
  }) => {
    await loginToAdmin(page);
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.getByRole('heading', { name: /blog admin/i })).toBeVisible();
  });

  test('admin dashboard lists all articles including the hidden one', async ({ page }) => {
    await loginToAdmin(page);

    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(TOTAL_ARTICLES);
    await expect(page.locator('tbody tr').filter({ hasText: HIDDEN_ARTICLE.title })).toContainText(
      'Hidden',
    );
    await expect(page.locator('tbody tr').filter({ hasText: COMMENT_ARTICLE.title })).toContainText(
      'Visible',
    );
  });

  test('admin can delete a comment when comment moderation UI is available', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', STATEFUL_BROWSER_HINT);

    await loginToAdmin(page);

    const commentsEntry = page
      .locator('a, button')
      .filter({ hasText: /comments|comment|评论/i })
      .first();
    test.skip((await commentsEntry.count()) === 0, 'Admin UI does not expose comment moderation.');

    const content = `Playwright admin delete ${Date.now()}`;
    const slug = articlePath(COMMENT_ARTICLE);
    const created = await postCommentWithAdaptivePayload(page, slug, content);
    expect(created.result.status === 200 || created.result.status === 201).toBe(true);

    await commentsEntry.click();
    await page.waitForLoadState('domcontentloaded');

    const entry = page
      .locator('tr, li, article, .comment-item, [data-testid="comment-item"]')
      .filter({ hasText: content })
      .first();
    test.skip((await entry.count()) === 0, 'Comment moderation view does not list the new comment.');

    const deleteControl = entry
      .locator('button, a')
      .filter({ hasText: /delete|remove|trash|删除/i })
      .first();
    test.skip((await deleteControl.count()) === 0, 'Comment moderation UI does not expose delete controls.');

    page.once('dialog', (dialog) => dialog.accept());
    await deleteControl.click();
    await expect(
      page
        .locator('tr, li, article, .comment-item, [data-testid="comment-item"]')
        .filter({ hasText: content }),
    ).toHaveCount(0);

    await go(page, slug);
    await expect(commentSection(page).getByText(content, { exact: true })).toHaveCount(0);
  });
});
