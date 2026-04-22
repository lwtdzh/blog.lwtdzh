import { articles as allArticleData, ArticleData } from '../generated/articles';

// Re-export the ArticleData type as ArticleMeta for compatibility
export interface ArticleMeta {
  id: number;
  slug: string;
  title: string;
  date: string;
  updated: string;
  description: string;
  tags: string[];
  cover: string;
  hidden: boolean;
}

function toMeta(data: ArticleData, index: number): ArticleMeta {
  return {
    id: index,
    slug: data.slug,
    title: data.title,
    date: data.date,
    updated: data.updated,
    description: data.description,
    tags: data.tags,
    cover: data.cover,
    hidden: data.hidden,
  };
}

// Initialize DB — only visitors + comments tables (articles are in bundled files)
export async function initDB(db: D1Database): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      count INTEGER DEFAULT 0
    )
  `).run();

  await db.prepare('CREATE INDEX IF NOT EXISTS idx_visitors_slug ON visitors (slug)').run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL,
      nickname TEXT NOT NULL,
      email TEXT DEFAULT '',
      commenter_type TEXT DEFAULT 'visitor',
      ip_address TEXT DEFAULT '',
      country TEXT DEFAULT '',
      region TEXT DEFAULT '',
      city TEXT DEFAULT '',
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const schema = await db.prepare('PRAGMA table_info(comments)').all<{ name: string }>();
  const columns = new Set((schema.results || []).map((column: any) => String(column.name)));

  const commentMigrations: Array<[string, string]> = [
    ['commenter_type', "ALTER TABLE comments ADD COLUMN commenter_type TEXT DEFAULT 'visitor'"],
    ['ip_address', "ALTER TABLE comments ADD COLUMN ip_address TEXT DEFAULT ''"],
    ['country', "ALTER TABLE comments ADD COLUMN country TEXT DEFAULT ''"],
    ['region', "ALTER TABLE comments ADD COLUMN region TEXT DEFAULT ''"],
    ['city', "ALTER TABLE comments ADD COLUMN city TEXT DEFAULT ''"],
  ];

  for (const [column, statement] of commentMigrations) {
    if (!columns.has(column)) {
      await db.prepare(statement).run();
    }
  }

  await db.prepare(
    'CREATE INDEX IF NOT EXISTS idx_comments_slug_created_at ON comments (slug, created_at DESC, id DESC)'
  ).run();
}

// Get all visible articles (sorted by date desc — already sorted in generated file)
export function getAllArticles(): ArticleMeta[] {
  return allArticleData
    .filter(a => !a.hidden)
    .map((a, i) => toMeta(a, i));
}

// Get all articles including hidden (for admin)
export function getAllArticlesAdmin(): ArticleMeta[] {
  return allArticleData.map((a, i) => toMeta(a, i));
}

// Get paginated articles
export function getArticlesPaginated(page: number, perPage: number = 10): { articles: ArticleMeta[]; total: number } {
  const visible = allArticleData.filter(a => !a.hidden);
  const total = visible.length;
  const offset = (page - 1) * perPage;
  const pageArticles = visible.slice(offset, offset + perPage);

  return {
    articles: pageArticles.map((a, i) => toMeta(a, offset + i)),
    total,
  };
}

// Get single article by slug (with content)
export function getArticleBySlug(slug: string): (ArticleMeta & { content: string }) | null {
  const index = allArticleData.findIndex(a => a.slug === slug);
  if (index === -1) return null;
  const a = allArticleData[index];
  return { ...toMeta(a, index), content: a.content };
}

// Get articles by tag
export function getArticlesByTag(tag: string): ArticleMeta[] {
  return allArticleData
    .filter(a => !a.hidden && a.tags.includes(tag))
    .map((a, i) => toMeta(a, i));
}

// Get adjacent articles (prev/next) based on date
export function getAdjacentArticles(date: string): { prev: ArticleMeta | null; next: ArticleMeta | null } {
  const visible = allArticleData.filter(a => !a.hidden);
  // Articles are sorted date DESC, so "prev" (older) is the next index, "next" (newer) is the previous index
  const currentIndex = visible.findIndex(a => a.date === date);

  const prev = currentIndex < visible.length - 1 ? toMeta(visible[currentIndex + 1], currentIndex + 1) : null;
  const next = currentIndex > 0 ? toMeta(visible[currentIndex - 1], currentIndex - 1) : null;

  return { prev, next };
}

// Get all tags with counts
export function getAllTags(): { tag: string; count: number }[] {
  const visible = allArticleData.filter(a => !a.hidden);
  const tagMap = new Map<string, number>();
  for (const article of visible) {
    for (const tag of article.tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }
  return Array.from(tagMap.entries()).map(([tag, count]) => ({ tag, count }));
}

// Get article count
export function getArticleCount(): number {
  return allArticleData.filter(a => !a.hidden).length;
}

// Get tag count
export function getTagCount(): number {
  return getAllTags().length;
}
