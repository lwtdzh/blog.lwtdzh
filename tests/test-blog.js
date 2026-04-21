const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8765;
const ROOT = path.resolve(__dirname, '..');

// Simple static file server
function createServer() {
  return http.createServer((req, res) => {
    let filePath = path.join(ROOT, decodeURIComponent(req.url));
    
    // Default to index.html for directories
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.xml': 'application/xml',
      '.txt': 'text/plain',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

async function runTests() {
  const server = createServer();
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Server running at http://localhost:${PORT}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.log(`  ✗ ${name}`);
      console.log(`    Error: ${err.message}`);
      failed++;
    }
  }

  // ===== Test 1: Homepage =====
  console.log('Homepage Tests:');
  const homePage = await context.newPage();
  await homePage.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });

  await test('Homepage loads successfully', async () => {
    const title = await homePage.title();
    if (!title.includes("Lwtdzh")) throw new Error(`Unexpected title: ${title}`);
  });

  await test('Homepage has article listings', async () => {
    const articles = await homePage.$$('.post-block');
    if (articles.length === 0) throw new Error('No articles found');
    console.log(`    Found ${articles.length} articles`);
  });

  await test('Homepage has navigation menu', async () => {
    const homeLink = await homePage.$('.menu-item-home');
    const archiveLink = await homePage.$('.menu-item-archives');
    if (!homeLink || !archiveLink) throw new Error('Navigation menu items missing');
  });

  await test('Homepage has link exchange section', async () => {
    const linkExchange = await homePage.$('#link-exchange');
    if (!linkExchange) throw new Error('Link exchange section not found');
  });

  await test('Homepage has new JS files loaded', async () => {
    const visitorsJs = await homePage.$('script[src="/js/visitors.js"]');
    const commentsJs = await homePage.$('script[src="/js/comments.js"]');
    const linkExchangeJs = await homePage.$('script[src="/js/link-exchange.js"]');
    if (!visitorsJs || !commentsJs || !linkExchangeJs) throw new Error('New JS files not loaded');
  });

  await test('Homepage has NO Valine references', async () => {
    const content = await homePage.content();
    if (content.includes('Valine') || content.includes('valine-comments')) {
      throw new Error('Valine references still present');
    }
  });

  await test('Homepage has visitor count elements', async () => {
    const visitors = await homePage.$$('.leancloud_visitors');
    if (visitors.length === 0) throw new Error('No visitor count elements found');
    console.log(`    Found ${visitors.length} visitor count elements`);
  });

  await homePage.close();

  // ===== Test 2: Article Page =====
  console.log('\nArticle Page Tests:');
  const articlePage = await context.newPage();
  await articlePage.goto(`http://localhost:${PORT}/2024/12/19/rambling/thirty-years-old-write-to-myself/`, { waitUntil: 'domcontentloaded' });

  await test('Article page loads successfully', async () => {
    const title = await articlePage.title();
    if (!title.includes("Lwtdzh")) throw new Error(`Unexpected title: ${title}`);
  });

  await test('Article page has content', async () => {
    const postBody = await articlePage.$('.post-body');
    if (!postBody) throw new Error('Post body not found');
    const text = await postBody.textContent();
    if (text.length < 50) throw new Error('Post body seems too short');
  });

  await test('Article page has comment section', async () => {
    const commentSection = await articlePage.$('#comments-section');
    if (!commentSection) throw new Error('Comment section not found');
  });

  await test('Article page has comment form', async () => {
    const form = await articlePage.$('.comment-form');
    if (!form) throw new Error('Comment form not found');
    const nicknameInput = await articlePage.$('.comment-input[name="nickname"]');
    const contentInput = await articlePage.$('.comment-textarea');
    const submitBtn = await articlePage.$('.comment-submit');
    if (!nicknameInput || !contentInput || !submitBtn) throw new Error('Comment form fields missing');
  });

  await test('Article page has NO Valine references', async () => {
    const content = await articlePage.content();
    if (content.includes('NexT.utils.loadComments') || content.includes('appId')) {
      throw new Error('Valine/LeanCloud references still present');
    }
  });

  await test('Article page has link exchange section', async () => {
    const linkExchange = await articlePage.$('#link-exchange');
    if (!linkExchange) throw new Error('Link exchange section not found');
  });

  await articlePage.close();

  // ===== Test 3: Archives Page =====
  console.log('\nArchives Page Tests:');
  const archivePage = await context.newPage();
  await archivePage.goto(`http://localhost:${PORT}/archives/`, { waitUntil: 'domcontentloaded' });

  await test('Archives page loads successfully', async () => {
    const title = await archivePage.title();
    if (!title.includes('Archive')) throw new Error(`Unexpected title: ${title}`);
  });

  await test('Archives page has link exchange section', async () => {
    const linkExchange = await archivePage.$('#link-exchange');
    if (!linkExchange) throw new Error('Link exchange section not found');
  });

  await archivePage.close();

  // ===== Test 4: Responsive Layout =====
  console.log('\nResponsive Layout Tests:');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewportSize({ width: 375, height: 667 });
  await mobilePage.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });

  await test('Mobile layout loads correctly', async () => {
    const title = await mobilePage.title();
    if (!title.includes("Lwtdzh")) throw new Error(`Unexpected title: ${title}`);
  });

  await test('Mobile layout has articles', async () => {
    const articles = await mobilePage.$$('.post-block');
    if (articles.length === 0) throw new Error('No articles found on mobile');
  });

  await mobilePage.close();

  // ===== Test 5: CSS Enhancements =====
  console.log('\nCSS Enhancement Tests:');
  const cssPage = await context.newPage();
  await cssPage.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });

  await test('CSS file loads with new styles', async () => {
    const cssContent = await cssPage.evaluate(async () => {
      const response = await fetch('/css/main.css');
      return response.text();
    });
    if (!cssContent.includes('--primary-color')) throw new Error('New CSS variables not found');
    if (!cssContent.includes('comment-form')) throw new Error('Comment form styles not found');
    if (!cssContent.includes('link-exchange')) throw new Error('Link exchange styles not found');
  });

  await cssPage.close();

  // ===== Test 6: Cloudflare Functions exist =====
  console.log('\nCloudflare Functions Tests:');
  await test('functions/api/comments.js exists', async () => {
    if (!fs.existsSync(path.join(ROOT, 'functions/api/comments.js'))) {
      throw new Error('comments.js function not found');
    }
  });

  await test('functions/api/visitors.js exists', async () => {
    if (!fs.existsSync(path.join(ROOT, 'functions/api/visitors.js'))) {
      throw new Error('visitors.js function not found');
    }
  });

  await test('wrangler.toml exists with D1 binding', async () => {
    const content = fs.readFileSync(path.join(ROOT, 'wrangler.toml'), 'utf-8');
    if (!content.includes('binding = "DB"')) throw new Error('D1 binding not configured');
  });

  // Summary
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`${'='.repeat(40)}`);

  await browser.close();
  server.close();

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
