# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: blog.spec.ts >> Homepage & Layout >> homepage loads with correct title
- Location: tests/blog.spec.ts:53:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "https://blog.lwtdzh.ip-ddns.com/", waiting until "domcontentloaded"

```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test';
  2   | 
  3   | const BASE = 'https://blog.lwtdzh.ip-ddns.com';
  4   | 
  5   | // Helper: navigate with retry logic for transient connection resets
  6   | async function go(page: Page, path: string, maxRetries = 3) {
  7   |   for (let attempt = 1; attempt <= maxRetries; attempt++) {
  8   |     try {
> 9   |       await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      |                  ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  10  |       return;
  11  |     } catch (err: any) {
  12  |       const msg = err?.message || '';
  13  |       if (attempt < maxRetries && (msg.includes('ERR_CONNECTION_RESET') || msg.includes('ERR_CONNECTION_REFUSED') || msg.includes('net::'))) {
  14  |         // Wait before retry with exponential backoff
  15  |         await page.waitForTimeout(2000 * attempt);
  16  |         continue;
  17  |       }
  18  |       throw err;
  19  |     }
  20  |   }
  21  | }
  22  | 
  23  | // Helper: call API from within the browser page context (avoids SSL issues with request context)
  24  | async function apiGet(page: Page, path: string): Promise<{ status: number; body: any }> {
  25  |   return page.evaluate(async (url: string) => {
  26  |     const res = await fetch(url);
  27  |     const text = await res.text();
  28  |     let body: any;
  29  |     try { body = JSON.parse(text); } catch { body = text; }
  30  |     return { status: res.status, body };
  31  |   }, `${BASE}${path}`);
  32  | }
  33  | 
  34  | async function apiPost(page: Page, path: string, data: any): Promise<{ status: number; body: any }> {
  35  |   return page.evaluate(async ({ url, data }: { url: string; data: any }) => {
  36  |     const res = await fetch(url, {
  37  |       method: 'POST',
  38  |       headers: { 'Content-Type': 'application/json' },
  39  |       body: JSON.stringify(data),
  40  |     });
  41  |     const text = await res.text();
  42  |     let body: any;
  43  |     try { body = JSON.parse(text); } catch { body = text; }
  44  |     return { status: res.status, body };
  45  |   }, { url: `${BASE}${path}`, data });
  46  | }
  47  | 
  48  | // ============================================================
  49  | // 1. HOMEPAGE & LAYOUT
  50  | // ============================================================
  51  | 
  52  | test.describe('Homepage & Layout', () => {
  53  |   test('homepage loads with correct title', async ({ page }) => {
  54  |     await go(page, '/');
  55  |     await expect(page).toHaveTitle(/Lwtdzh's Blog/);
  56  |   });
  57  | 
  58  |   test('header contains site title and navigation', async ({ page }) => {
  59  |     await go(page, '/');
  60  |     await expect(page.locator('h1.site-title')).toHaveText("Lwtdzh's Blog");
  61  |     await expect(page.locator('a[href="/"]').filter({ hasText: 'Home' })).toBeVisible();
  62  |     await expect(page.locator('a[href="/archives/"]').filter({ hasText: 'Archives' })).toBeVisible();
  63  |   });
  64  | 
  65  |   test('sidebar shows author info, post count and tag count', async ({ page }) => {
  66  |     await go(page, '/');
  67  |     await expect(page.locator('.site-author-name')).toHaveText('lwtdzh');
  68  |     await expect(page.locator('.site-author-image')).toHaveAttribute('src', '/images/avatar.gif');
  69  | 
  70  |     const postCount = await page.locator('.site-state-posts .site-state-item-count').textContent();
  71  |     expect(Number(postCount?.trim())).toBeGreaterThan(0);
  72  | 
  73  |     const tagCount = await page.locator('.site-state-tags .site-state-item-count').textContent();
  74  |     expect(Number(tagCount?.trim())).toBeGreaterThan(0);
  75  |   });
  76  | 
  77  |   test('footer is present', async ({ page }) => {
  78  |     await go(page, '/');
  79  |     await expect(page.locator('footer.footer')).toBeVisible();
  80  |     await expect(page.locator('.copyright')).toContainText('Cloudflare');
  81  |   });
  82  | 
  83  |   test('homepage lists article cards with titles and dates', async ({ page }) => {
  84  |     await go(page, '/');
  85  |     const articles = page.locator('article.post-block');
  86  |     const count = await articles.count();
  87  |     expect(count).toBeGreaterThan(0);
  88  |     expect(count).toBeLessThanOrEqual(10);
  89  | 
  90  |     const firstArticle = articles.first();
  91  |     await expect(firstArticle.locator('.post-title a')).toBeVisible();
  92  |     await expect(firstArticle.locator('time')).toBeVisible();
  93  |   });
  94  | 
  95  |   test('homepage articles have "Read more" buttons', async ({ page }) => {
  96  |     await go(page, '/');
  97  |     const readMoreButtons = page.locator('a.btn:has-text("Read more")');
  98  |     const count = await readMoreButtons.count();
  99  |     expect(count).toBeGreaterThan(0);
  100 |   });
  101 | 
  102 |   test('homepage has visitor count placeholders', async ({ page }) => {
  103 |     await go(page, '/');
  104 |     const visitorSpans = page.locator('.leancloud-visitors-count');
  105 |     const count = await visitorSpans.count();
  106 |     expect(count).toBeGreaterThan(0);
  107 |   });
  108 | });
  109 | 
```