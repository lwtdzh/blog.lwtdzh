import { Hono } from 'hono';
import { getArticlesPaginated, getArticleBySlug, getAdjacentArticles, getAllArticles, getArticlesByTag, getArticleCount, getTagCount } from '../lib/articles';
import { renderMarkdown, getExcerpt } from '../lib/markdown';
import { renderLayout } from '../templates/layout';
import { renderHomePage } from '../templates/home';
import { renderPostPage } from '../templates/post';
import { renderArchivePage } from '../templates/archive';
import { renderTagPage } from '../templates/tag';

type Bindings = {
  DB: D1Database;
};

const pages = new Hono<{ Bindings: Bindings }>();

const PER_PAGE = 10;

// Homepage
pages.get('/', async (c) => {
  const db = c.env.DB;
  const { articles, total } = await getArticlesPaginated(db, 1, PER_PAGE);
  const totalPages = Math.ceil(total / PER_PAGE);
  const postCount = await getArticleCount(db);
  const tagCount = await getTagCount(db);

  // Build excerpts
  const excerpts = new Map<string, string>();
  for (const article of articles) {
    const full = await getArticleBySlug(db, article.slug);
    if (full) {
      excerpts.set(article.slug, getExcerpt(full.content));
    }
  }

  const content = renderHomePage(articles, excerpts, 1, totalPages);
  const html = renderLayout({
    title: 'Lwtdzh\'s Blog',
    isHome: true,
    postCount,
    tagCount,
    content,
  });
  return c.html(html);
});

// Paginated homepage
pages.get('/page/:num/', async (c) => {
  const page = parseInt(c.req.param('num')) || 1;
  const db = c.env.DB;
  const { articles, total } = await getArticlesPaginated(db, page, PER_PAGE);
  const totalPages = Math.ceil(total / PER_PAGE);
  const postCount = await getArticleCount(db);
  const tagCount = await getTagCount(db);

  const excerpts = new Map<string, string>();
  for (const article of articles) {
    const full = await getArticleBySlug(db, article.slug);
    if (full) {
      excerpts.set(article.slug, getExcerpt(full.content));
    }
  }

  const content = renderHomePage(articles, excerpts, page, totalPages);
  const html = renderLayout({
    title: `Page ${page} | Lwtdzh's Blog`,
    isHome: true,
    postCount,
    tagCount,
    content,
  });
  return c.html(html);
});

// Archives
pages.get('/archives/', async (c) => {
  const db = c.env.DB;
  const articles = await getAllArticles(db);
  const postCount = articles.length;
  const tagCount = await getTagCount(db);

  const content = renderArchivePage(articles);
  const html = renderLayout({
    title: 'Archives',
    postCount,
    tagCount,
    content,
  });
  return c.html(html);
});

// Archives by year
pages.get('/archives/:year/', async (c) => {
  const year = c.req.param('year');
  const db = c.env.DB;
  const allArticles = await getAllArticles(db);
  const articles = allArticles.filter(a => a.date.startsWith(year));
  const postCount = allArticles.length;
  const tagCount = await getTagCount(db);

  const content = renderArchivePage(articles, year);
  const html = renderLayout({
    title: `Archives: ${year}`,
    postCount,
    tagCount,
    content,
  });
  return c.html(html);
});

// Archives by year/month
pages.get('/archives/:year/:month/', async (c) => {
  const year = c.req.param('year');
  const month = c.req.param('month');
  const db = c.env.DB;
  const allArticles = await getAllArticles(db);
  const articles = allArticles.filter(a => a.date.startsWith(`${year}-${month}`));
  const postCount = allArticles.length;
  const tagCount = await getTagCount(db);

  const content = renderArchivePage(articles, year, month);
  const html = renderLayout({
    title: `Archives: ${year}/${month}`,
    postCount,
    tagCount,
    content,
  });
  return c.html(html);
});

// Tag page
pages.get('/tags/:tag/', async (c) => {
  const tag = decodeURIComponent(c.req.param('tag'));
  const db = c.env.DB;
  const articles = await getArticlesByTag(db, tag);
  const postCount = await getArticleCount(db);
  const tagCount = await getTagCount(db);

  const content = renderTagPage(tag, articles);
  const html = renderLayout({
    title: `Tag: ${tag}`,
    postCount,
    tagCount,
    content,
  });
  return c.html(html);
});

// Single article page — matches patterns like /2024/12/05/jpsub/eromanga/
pages.get('/:year/:month/:day/:category/:slug/', async (c) => {
  const year = c.req.param('year');
  const month = c.req.param('month');
  const day = c.req.param('day');
  const category = c.req.param('category');
  const slug = c.req.param('slug');
  const fullSlug = `${year}/${month}/${day}/${category}/${slug}`;

  const db = c.env.DB;
  const article = await getArticleBySlug(db, fullSlug);
  if (!article) {
    return c.text('Article not found', 404);
  }

  const htmlContent = renderMarkdown(article.content);
  const { prev, next } = await getAdjacentArticles(db, article.date);
  const postCount = await getArticleCount(db);
  const tagCount = await getTagCount(db);

  const content = renderPostPage(article, htmlContent, prev, next);
  const html = renderLayout({
    title: article.title,
    description: article.description,
    isPost: true,
    ogType: 'article',
    ogUrl: `https://blog.lwtdzh.ip-ddns.com/${fullSlug}/`,
    canonicalUrl: `https://blog.lwtdzh.ip-ddns.com/${fullSlug}/`,
    ogImage: article.cover || undefined,
    postCount,
    tagCount,
    content,
  });
  return c.html(html);
});

export default pages;
