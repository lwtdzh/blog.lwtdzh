import { Hono } from 'hono';
import { getArticlesPaginated, getArticleBySlug, getAdjacentArticles, getAllArticles, getArticlesByTag, getArticleCount, getTagCount } from '../lib/articles';
import { renderMarkdown, getExcerpt } from '../lib/markdown';
import { renderLayout } from '../templates/layout';
import { renderHomePage } from '../templates/home';
import { renderPostPage } from '../templates/post';
import { renderArchivePage } from '../templates/archive';
import { renderTagPage } from '../templates/tag';

const pages = new Hono();

const PER_PAGE = 10;

// Homepage
pages.get('/', (c) => {
  const { articles, total } = getArticlesPaginated(1, PER_PAGE);
  const totalPages = Math.ceil(total / PER_PAGE);
  const postCount = getArticleCount();
  const tagCount = getTagCount();

  const excerpts = new Map<string, string>();
  for (const article of articles) {
    const full = getArticleBySlug(article.slug);
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
pages.get('/page/:num/', (c) => {
  const page = parseInt(c.req.param('num')) || 1;
  const { articles, total } = getArticlesPaginated(page, PER_PAGE);
  const totalPages = Math.ceil(total / PER_PAGE);
  const postCount = getArticleCount();
  const tagCount = getTagCount();

  const excerpts = new Map<string, string>();
  for (const article of articles) {
    const full = getArticleBySlug(article.slug);
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
pages.get('/archives/', (c) => {
  const articles = getAllArticles();
  const postCount = articles.length;
  const tagCount = getTagCount();

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
pages.get('/archives/:year/', (c) => {
  const year = c.req.param('year');
  const allArticlesList = getAllArticles();
  const articles = allArticlesList.filter(a => a.date.startsWith(year));
  const postCount = allArticlesList.length;
  const tagCount = getTagCount();

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
pages.get('/archives/:year/:month/', (c) => {
  const year = c.req.param('year');
  const month = c.req.param('month');
  const allArticlesList = getAllArticles();
  const articles = allArticlesList.filter(a => a.date.startsWith(`${year}-${month}`));
  const postCount = allArticlesList.length;
  const tagCount = getTagCount();

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
pages.get('/tags/:tag/', (c) => {
  const tag = decodeURIComponent(c.req.param('tag'));
  const articles = getArticlesByTag(tag);
  const postCount = getArticleCount();
  const tagCount = getTagCount();

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
pages.get('/:year/:month/:day/:category/:slug/', (c) => {
  const year = c.req.param('year');
  const month = c.req.param('month');
  const day = c.req.param('day');
  const category = c.req.param('category');
  const slug = c.req.param('slug');
  const fullSlug = `${year}/${month}/${day}/${category}/${slug}`;

  const article = getArticleBySlug(fullSlug);
  if (!article) {
    return c.text('Article not found', 404);
  }

  const htmlContent = renderMarkdown(article.content);
  const { prev, next } = getAdjacentArticles(article.date);
  const postCount = getArticleCount();
  const tagCount = getTagCount();

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
