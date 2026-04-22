import { test, expect, Page } from '@playwright/test';

// Set BASE_URL env var to override, e.g.: BASE_URL=https://blog-lwtdzh.pages.dev npx playwright test
const BASE = process.env.BASE_URL || 'https://blog.lwtdzh.ip-ddns.com';

// Helper: navigate with retry logic for transient connection resets
async function go(page: Page, path: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      return;
    } catch (err: any) {
      const msg = err?.message || '';
      if (attempt < maxRetries && (msg.includes('ERR_CONNECTION_RESET') || msg.includes('ERR_CONNECTION_REFUSED') || msg.includes('net::'))) {
        // Wait before retry with exponential backoff
        await page.waitForTimeout(2000 * attempt);
        continue;
      }
      throw err;
    }
  }
}

// Helper: call API from within the browser page context (avoids SSL issues with request context)
async function apiGet(page: Page, path: string): Promise<{ status: number; body: any }> {
  return page.evaluate(async (url: string) => {
    const res = await fetch(url);
    const text = await res.text();
    let body: any;
    try { body = JSON.parse(text); } catch { body = text; }
    return { status: res.status, body };
  }, `${BASE}${path}`);
}

async function apiPost(page: Page, path: string, data: any): Promise<{ status: number; body: any }> {
  return page.evaluate(async ({ url, data }: { url: string; data: any }) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const text = await res.text();
    let body: any;
    try { body = JSON.parse(text); } catch { body = text; }
    return { status: res.status, body };
  }, { url: `${BASE}${path}`, data });
}

// ============================================================
// 1. HOMEPAGE & LAYOUT
// ============================================================

test.describe('Homepage & Layout', () => {
  test('homepage loads with correct title', async ({ page }) => {
    await go(page, '/');
    await expect(page).toHaveTitle(/Lwtdzh's Blog/);
  });

  test('header contains site title and navigation', async ({ page }) => {
    await go(page, '/');
    await expect(page.locator('h1.site-title')).toHaveText("Lwtdzh's Blog");
    await expect(page.locator('a[href="/"]').filter({ hasText: 'Home' })).toBeVisible();
    await expect(page.locator('a[href="/archives/"]').filter({ hasText: 'Archives' })).toBeVisible();
  });

  test('sidebar shows author info, post count and tag count', async ({ page }) => {
    await go(page, '/');
    await expect(page.locator('.site-author-name')).toHaveText('lwtdzh');
    await expect(page.locator('.site-author-image')).toHaveAttribute('src', '/images/avatar.gif');

    const postCount = await page.locator('.site-state-posts .site-state-item-count').textContent();
    expect(Number(postCount?.trim())).toBeGreaterThan(0);

    const tagCount = await page.locator('.site-state-tags .site-state-item-count').textContent();
    expect(Number(tagCount?.trim())).toBeGreaterThan(0);
  });

  test('footer is present', async ({ page }) => {
    await go(page, '/');
    await expect(page.locator('footer.footer')).toBeVisible();
    await expect(page.locator('.copyright')).toContainText('Cloudflare');
  });

  test('homepage lists article cards with titles and dates', async ({ page }) => {
    await go(page, '/');
    const articles = page.locator('article.post-block');
    const count = await articles.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(10);

    const firstArticle = articles.first();
    await expect(firstArticle.locator('.post-title a')).toBeVisible();
    await expect(firstArticle.locator('time')).toBeVisible();
  });

  test('homepage articles have "Read more" buttons', async ({ page }) => {
    await go(page, '/');
    const readMoreButtons = page.locator('a.btn:has-text("Read more")');
    const count = await readMoreButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('homepage has visitor count placeholders', async ({ page }) => {
    await go(page, '/');
    const visitorSpans = page.locator('.leancloud-visitors-count');
    const count = await visitorSpans.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ============================================================
// 2. ARTICLE / POST PAGE
// ============================================================

test.describe('Article Page', () => {
  const articleSlug = '2024/08/14/jpsub/clannad';

  test('article page loads with correct title', async ({ page }) => {
    await go(page, `/${articleSlug}/`);
    await expect(page).toHaveTitle(/CLANNAD/);
  });

  test('article page has post header with title and date', async ({ page }) => {
    await go(page, `/${articleSlug}/`);
    await expect(page.locator('h1.post-title')).toContainText('CLANNAD');
    await expect(page.locator('.post-meta time').first()).toBeVisible();
  });

  test('article page has post body with content', async ({ page }) => {
    await go(page, `/${articleSlug}/`);
    const body = page.locator('.post-body');
    await expect(body).toBeVisible();

    const bodyText = await body.textContent();
    expect(bodyText).toContain('CLANNAD');
    expect(bodyText).toContain('下载地址');
  });

  test('article page has tags', async ({ page }) => {
    await go(page, `/${articleSlug}/`);
    const tags = page.locator('.post-tags a');
    await expect(tags.first()).toBeVisible();
    await expect(tags.first()).toContainText('中日双语字幕');
  });

  test('article page has prev/next navigation', async ({ page }) => {
    await go(page, `/${articleSlug}/`);
    const postNav = page.locator('.post-nav');
    await expect(postNav).toBeVisible();
    const navLinks = postNav.locator('a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('article page has comment form', async ({ page }) => {
    await go(page, `/${articleSlug}/`);
    await expect(page.locator('#comments-section')).toBeVisible();
    await expect(page.locator('input[name="nickname"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('textarea[name="content"]')).toBeVisible();
    await expect(page.locator('button.comment-submit')).toBeVisible();
  });

  test('clicking tag link navigates to tag page', async ({ page }) => {
    await go(page, `/${articleSlug}/`);
    const tagLink = page.locator('.post-tags a').first();
    await tagLink.click();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/tags/');
  });
});

// ============================================================
// 3. ARCHIVES PAGE
// ============================================================

test.describe('Archives Page', () => {
  test('archives page loads and shows article count', async ({ page }) => {
    await go(page, '/archives/');
    await expect(page).toHaveTitle(/Archives/);
    const header = page.locator('.collection-title .collection-header');
    const text = await header.textContent();
    expect(text).toContain('posts in total');
  });

  test('archives page groups articles by year', async ({ page }) => {
    await go(page, '/archives/');
    const yearHeaders = page.locator('.collection-year .collection-header');
    const count = await yearHeaders.count();
    expect(count).toBeGreaterThan(0);

    const firstYear = await yearHeaders.first().textContent();
    expect(firstYear?.trim()).toMatch(/^\d{4}$/);
  });

  test('archives page lists articles with dates and title links', async ({ page }) => {
    await go(page, '/archives/');
    const articles = page.locator('.posts-collapse article');
    const count = await articles.count();
    expect(count).toBeGreaterThan(0);

    const firstArticle = articles.first();
    await expect(firstArticle.locator('time')).toBeVisible();
    await expect(firstArticle.locator('.post-title-link')).toBeVisible();
  });

  test('clicking an article link in archives navigates to the article', async ({ page }) => {
    await go(page, '/archives/');
    const firstLink = page.locator('.post-title-link').first();
    const href = await firstLink.getAttribute('href');
    await firstLink.click();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain(href!);
  });

  test('archives by year works', async ({ page }) => {
    await go(page, '/archives/2024/');
    const articles = page.locator('.posts-collapse article');
    const count = await articles.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ============================================================
// 4. TAG PAGE
// ============================================================

test.describe('Tag Page', () => {
  test('tag page loads for 中日双语字幕', async ({ page }) => {
    await go(page, `/tags/${encodeURIComponent('中日双语字幕')}/`);
    await expect(page).toHaveTitle(/中日双语字幕/);
    await expect(page.locator('.collection-header').first()).toContainText('中日双语字幕');
  });

  test('tag page lists articles with that tag', async ({ page }) => {
    await go(page, `/tags/${encodeURIComponent('中日双语字幕')}/`);
    const articles = page.locator('.posts-collapse article');
    const count = await articles.count();
    expect(count).toBeGreaterThan(5);
  });

  test('tag page for "test" shows test articles', async ({ page }) => {
    await go(page, '/tags/test/');
    await expect(page).toHaveTitle(/test/);
    const articles = page.locator('.posts-collapse article');
    const count = await articles.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================
// 5. VISITORS API (via browser fetch to avoid SSL issues)
// ============================================================

test.describe('Visitors API', () => {
  test('GET /api/visitors with slug returns count', async ({ page }) => {
    await go(page, '/');
    const res = await apiGet(page, '/api/visitors?slug=2024/08/14/jpsub/clannad');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('slug', '2024/08/14/jpsub/clannad');
    expect(typeof res.body.count).toBe('number');
    expect(res.body.count).toBeGreaterThanOrEqual(0);
  });

  test('GET /api/visitors with multiple slugs returns counts', async ({ page }) => {
    await go(page, '/');
    const res = await apiGet(page, '/api/visitors?slugs=2024/08/14/jpsub/clannad,2024/12/05/jpsub/eromanga');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('2024/08/14/jpsub/clannad');
    expect(res.body).toHaveProperty('2024/12/05/jpsub/eromanga');
  });

  test('POST /api/visitors increments count', async ({ page }) => {
    await go(page, '/');
    const testSlug = '__playwright_test_' + Date.now();

    const res1 = await apiPost(page, '/api/visitors', { slug: testSlug });
    expect(res1.status).toBe(200);
    expect(res1.body.slug).toBe(testSlug);
    expect(res1.body.count).toBe(1);

    const res2 = await apiPost(page, '/api/visitors', { slug: testSlug });
    expect(res2.body.count).toBe(2);
  });

  test('GET /api/visitors without params returns error', async ({ page }) => {
    await go(page, '/');
    const res = await apiGet(page, '/api/visitors');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/visitors without slug returns error', async ({ page }) => {
    await go(page, '/');
    const res = await apiPost(page, '/api/visitors', {});
    expect(res.status).toBe(400);
  });
});

// ============================================================
// 6. COMMENTS API (via browser fetch)
// ============================================================

test.describe('Comments API', () => {
  test('GET /api/comments with slug returns array', async ({ page }) => {
    await go(page, '/');
    const res = await apiGet(page, '/api/comments?slug=2024/08/14/jpsub/clannad');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/comments creates a comment and GET retrieves it', async ({ page }) => {
    await go(page, '/');
    const testSlug = '__playwright_comment_test_' + Date.now();
    const commentContent = 'Automated test comment ' + Date.now();

    const postRes = await apiPost(page, '/api/comments', {
      slug: testSlug,
      nickname: 'PlaywrightBot',
      email: 'test@example.com',
      content: commentContent,
    });
    expect(postRes.status).toBe(201);
    expect(postRes.body.success).toBe(true);

    const getRes = await apiGet(page, `/api/comments?slug=${testSlug}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.length).toBe(1);
    expect(getRes.body[0].nickname).toBe('PlaywrightBot');
    expect(getRes.body[0].content).toBe(commentContent);
    expect(getRes.body[0].email).toBe('test@example.com');
    expect(getRes.body[0]).toHaveProperty('created_at');
  });

  test('POST /api/comments without required fields returns error', async ({ page }) => {
    await go(page, '/');
    const res = await apiPost(page, '/api/comments', { slug: 'test' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Missing required fields');
  });

  test('GET /api/comments without slug returns error', async ({ page }) => {
    await go(page, '/');
    const res = await apiGet(page, '/api/comments');
    expect(res.status).toBe(400);
  });
});

// ============================================================
// 7. VISITOR COUNT UI INTEGRATION
// ============================================================

test.describe('Visitor Count UI', () => {
  test('homepage loads visitor counts via JS', async ({ page }) => {
    await go(page, '/');
    // Wait for JS to populate visitor counts
    const visitorSpans = page.locator('.leancloud-visitors-count');
    const count = await visitorSpans.count();
    expect(count).toBeGreaterThan(0);

    // Wait for at least one to become numeric
    await expect(async () => {
      let foundNumeric = false;
      for (let i = 0; i < count; i++) {
        const text = await visitorSpans.nth(i).textContent();
        if (text && /^\d+$/.test(text.trim())) {
          foundNumeric = true;
          break;
        }
      }
      expect(foundNumeric).toBe(true);
    }).toPass({ timeout: 10000 });
  });

  test('article page loads visitor count via JS', async ({ page }) => {
    await go(page, '/2024/08/14/jpsub/clannad/');
    const visitorCount = page.locator('.leancloud-visitors-count');
    await expect(async () => {
      const text = await visitorCount.textContent();
      expect(text?.trim()).toMatch(/^\d+$/);
    }).toPass({ timeout: 10000 });
  });
});

// ============================================================
// 8. COMMENTS UI INTEGRATION
// ============================================================

test.describe('Comments UI', () => {
  test('article page has comment list container', async ({ page }) => {
    await go(page, '/2024/08/14/jpsub/clannad/');
    await expect(page.locator('.comment-list')).toBeVisible();
  });

  test('submitting a comment via the form works', async ({ page }) => {
    await go(page, '/2022/09/07/test/hello-world/');
    await page.waitForLoadState('domcontentloaded');

    const uniqueContent = 'Playwright test comment ' + Date.now();

    await page.fill('input[name="nickname"]', 'PlaywrightTestUser');
    await page.fill('input[name="email"]', 'playwright@test.com');
    await page.fill('textarea[name="content"]', uniqueContent);
    await page.click('button.comment-submit');

    // Wait for the comment to appear
    await expect(async () => {
      const commentText = await page.locator('.comment-list').textContent();
      expect(commentText).toContain(uniqueContent);
    }).toPass({ timeout: 10000 });
  });
});

// ============================================================
// 9. SITEMAP & ROBOTS (via browser fetch)
// ============================================================

test.describe('Sitemap & Robots', () => {
  test('sitemap.xml returns valid XML with article URLs', async ({ page }) => {
    await go(page, '/');
    const res = await apiGet(page, '/sitemap.xml');
    expect(res.status).toBe(200);
    const body = typeof res.body === 'string' ? res.body : JSON.stringify(res.body);
    expect(body).toContain('urlset');
    expect(body).toContain('blog.lwtdzh.ip-ddns.com');
    expect(body).toContain('/jpsub/');
  });

  test('baidusitemap.xml returns valid XML', async ({ page }) => {
    await go(page, '/');
    const res = await apiGet(page, '/baidusitemap.xml');
    expect(res.status).toBe(200);
    const body = typeof res.body === 'string' ? res.body : JSON.stringify(res.body);
    expect(body).toContain('urlset');
  });

  test('robots.txt returns correct content', async ({ page }) => {
    await go(page, '/');
    const res = await apiGet(page, '/robots.txt');
    expect(res.status).toBe(200);
    const body = typeof res.body === 'string' ? res.body : JSON.stringify(res.body);
    expect(body).toContain('User-agent');
    expect(body).toContain('Sitemap');
  });
});

// ============================================================
// 10. STATIC ASSETS (check via page script tags and link tags)
// ============================================================

test.describe('Static Assets', () => {
  test('main CSS is linked in the page', async ({ page }) => {
    await go(page, '/');
    const cssLink = page.locator('link[href="/css/main.css"]');
    await expect(cssLink).toHaveCount(1);
  });

  test('JS files are loaded in the page', async ({ page }) => {
    await go(page, '/');
    for (const file of ['utils.js', 'next-boot.js', 'visitors.js', 'comments.js']) {
      const script = page.locator(`script[src="/js/${file}"]`);
      await expect(script).toHaveCount(1);
    }
  });

  test('Font Awesome CSS is linked', async ({ page }) => {
    await go(page, '/');
    const faLink = page.locator('link[href="/lib/font-awesome/css/all.min.css"]');
    await expect(faLink).toHaveCount(1);
  });
});

// ============================================================
// 11. NAVIGATION & ROUTING
// ============================================================

test.describe('Navigation & Routing', () => {
  test('clicking Home link navigates to homepage', async ({ page }) => {
    await go(page, '/archives/');
    await page.click('a[href="/"]');
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toBe(BASE + '/');
  });

  test('clicking Archives link navigates to archives', async ({ page }) => {
    await go(page, '/');
    await page.click('a[href="/archives/"]');
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toBe(BASE + '/archives/');
  });

  test('clicking an article title on homepage navigates to article', async ({ page }) => {
    await go(page, '/');
    const firstLink = page.locator('article.post-block .post-title a').first();
    const href = await firstLink.getAttribute('href');
    await firstLink.click();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain(href!);
    await expect(page.locator('h1.post-title')).toBeVisible();
  });

  test('clicking "Read more" navigates to article', async ({ page }) => {
    await go(page, '/');
    const readMore = page.locator('a.btn:has-text("Read more")').first();
    await readMore.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.post-body')).toBeVisible();
  });

  test('404 for non-existent article', async ({ page }) => {
    const res = await page.goto('/9999/99/99/nonexistent/slug/', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(404);
  });
});

// ============================================================
// 12. PAGINATION
// ============================================================

test.describe('Pagination', () => {
  test('page 2 loads if there are enough articles', async ({ page }) => {
    await go(page, '/');
    const pagination = page.locator('nav.pagination');
    const hasPagination = await pagination.count() > 0;

    if (hasPagination) {
      await page.click('a.page-number:has-text("2")');
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('/page/2/');
      const articles = page.locator('article.post-block');
      const count = await articles.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

// ============================================================
// 13. ARTICLE CONTENT INTEGRITY
// ============================================================

test.describe('Article Content Integrity', () => {
  test('CLANNAD article has download links', async ({ page }) => {
    await go(page, '/2024/08/14/jpsub/clannad/');
    const body = page.locator('.post-body');
    const text = await body.textContent();
    expect(text).toContain('Lanzou');
    expect(text).toContain('Baidu');
    expect(text).toContain('Github');
  });

  test('CLANNAD article has cover image', async ({ page }) => {
    await go(page, '/2024/08/14/jpsub/clannad/');
    const images = page.locator('.post-body img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Hello World article has Hexo quick start content', async ({ page }) => {
    await go(page, '/2022/09/07/test/hello-world/');
    const body = page.locator('.post-body');
    const text = await body.textContent();
    expect(text).toContain('Quick Start');
    expect(text).toContain('hexo');
  });

  test('Image Host Test article has image elements', async ({ page }) => {
    await go(page, '/2022/09/07/test/Image-Host-Test/');
    const images = page.locator('.post-body img');
    const count = await images.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('hidden article (thirty-years-old) is not listed on homepage', async ({ page }) => {
    await go(page, '/');
    const allText = await page.locator('.content').textContent();
    expect(allText).not.toContain('我满30岁');
  });

  test('hidden article is not listed in archives', async ({ page }) => {
    await go(page, '/archives/');
    const allText = await page.locator('.content').textContent();
    expect(allText).not.toContain('我满30岁');
  });
});

// ============================================================
// 14. SEO & META
// ============================================================

test.describe('SEO & Meta Tags', () => {
  test('homepage has correct OG tags', async ({ page }) => {
    await go(page, '/');
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute('content', "Lwtdzh's Blog");
  });

  test('article page has article OG type', async ({ page }) => {
    await go(page, '/2024/08/14/jpsub/clannad/');
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  });

  test('article page has canonical URL', async ({ page }) => {
    await go(page, '/2024/08/14/jpsub/clannad/');
    const canonical = page.locator('link[rel="canonical"]');
    const href = await canonical.getAttribute('href');
    expect(href).toContain('2024/08/14/jpsub/clannad');
  });
});

// ============================================================
// 15. CORS (via browser fetch)
// ============================================================

test.describe('CORS Headers', () => {
  test('API responses include CORS headers', async ({ page }) => {
    await go(page, '/');
    const corsOk = await page.evaluate(async (base: string) => {
      const res = await fetch(`${base}/api/visitors?slug=test`);
      return res.headers.get('access-control-allow-origin') === '*';
    }, BASE);
    expect(corsOk).toBe(true);
  });
});

// ============================================================
// 16. RESPONSIVE LAYOUT
// ============================================================

test.describe('Responsive Layout', () => {
  test('mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await go(page, '/');
    await expect(page.locator('h1.site-title')).toBeVisible();
    const articles = page.locator('article.post-block');
    const count = await articles.count();
    expect(count).toBeGreaterThan(0);
  });

  test('tablet viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await go(page, '/');
    await expect(page.locator('h1.site-title')).toBeVisible();
  });
});
