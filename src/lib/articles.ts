export interface Article {
  id?: number;
  slug: string;
  title: string;
  date: string;
  updated: string;
  description: string;
  tags: string; // JSON array string
  cover: string;
  content: string;
  hidden: number; // 0 or 1
}

export interface ArticleMeta {
  id: number;
  slug: string;
  title: string;
  date: string;
  updated: string;
  description: string;
  tags: string[];
  cover: string;
  hidden: number;
}

function parseTags(tagsStr: string): string[] {
  try {
    return JSON.parse(tagsStr);
  } catch {
    return [];
  }
}

function toMeta(row: any): ArticleMeta {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    date: row.date,
    updated: row.updated || row.date,
    description: row.description || '',
    tags: parseTags(row.tags || '[]'),
    cover: row.cover || '',
    hidden: row.hidden || 0,
  };
}

export async function initDB(db: D1Database): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      updated TEXT,
      description TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      cover TEXT DEFAULT '',
      content TEXT DEFAULT '',
      hidden INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      count INTEGER DEFAULT 0
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL,
      nickname TEXT NOT NULL,
      email TEXT DEFAULT '',
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

// Get all visible articles (no content field for performance)
export async function getAllArticles(db: D1Database): Promise<ArticleMeta[]> {
  const { results } = await db.prepare(
    'SELECT id, slug, title, date, updated, description, tags, cover, hidden FROM articles WHERE hidden = 0 ORDER BY date DESC'
  ).all();
  return (results || []).map(toMeta);
}

// Get all articles including hidden (for admin)
export async function getAllArticlesAdmin(db: D1Database): Promise<ArticleMeta[]> {
  const { results } = await db.prepare(
    'SELECT id, slug, title, date, updated, description, tags, cover, hidden FROM articles ORDER BY date DESC'
  ).all();
  return (results || []).map(toMeta);
}

// Get paginated articles
export async function getArticlesPaginated(db: D1Database, page: number, perPage: number = 10): Promise<{ articles: ArticleMeta[]; total: number }> {
  const countResult = await db.prepare('SELECT COUNT(*) as count FROM articles WHERE hidden = 0').first<{ count: number }>();
  const total = countResult?.count || 0;
  const offset = (page - 1) * perPage;

  const { results } = await db.prepare(
    'SELECT id, slug, title, date, updated, description, tags, cover, hidden FROM articles WHERE hidden = 0 ORDER BY date DESC LIMIT ? OFFSET ?'
  ).bind(perPage, offset).all();

  return {
    articles: (results || []).map(toMeta),
    total,
  };
}

// Get single article by slug (with content)
export async function getArticleBySlug(db: D1Database, slug: string): Promise<(ArticleMeta & { content: string }) | null> {
  const row = await db.prepare(
    'SELECT id, slug, title, date, updated, description, tags, cover, content, hidden FROM articles WHERE slug = ?'
  ).bind(slug).first();

  if (!row) return null;
  return { ...toMeta(row), content: (row as any).content || '' };
}

// Get articles by tag
export async function getArticlesByTag(db: D1Database, tag: string): Promise<ArticleMeta[]> {
  const { results } = await db.prepare(
    "SELECT id, slug, title, date, updated, description, tags, cover, hidden FROM articles WHERE hidden = 0 AND tags LIKE ? ORDER BY date DESC"
  ).bind(`%"${tag}"%`).all();
  return (results || []).map(toMeta);
}

// Get adjacent articles (prev/next)
export async function getAdjacentArticles(db: D1Database, date: string): Promise<{ prev: ArticleMeta | null; next: ArticleMeta | null }> {
  const prevRow = await db.prepare(
    'SELECT id, slug, title, date, updated, description, tags, cover, hidden FROM articles WHERE hidden = 0 AND date < ? ORDER BY date DESC LIMIT 1'
  ).bind(date).first();

  const nextRow = await db.prepare(
    'SELECT id, slug, title, date, updated, description, tags, cover, hidden FROM articles WHERE hidden = 0 AND date > ? ORDER BY date ASC LIMIT 1'
  ).bind(date).first();

  return {
    prev: prevRow ? toMeta(prevRow) : null,
    next: nextRow ? toMeta(nextRow) : null,
  };
}

// Get all tags with counts
export async function getAllTags(db: D1Database): Promise<{ tag: string; count: number }[]> {
  const articles = await getAllArticles(db);
  const tagMap = new Map<string, number>();
  for (const article of articles) {
    for (const tag of article.tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }
  return Array.from(tagMap.entries()).map(([tag, count]) => ({ tag, count }));
}

// Get article count
export async function getArticleCount(db: D1Database): Promise<number> {
  const result = await db.prepare('SELECT COUNT(*) as count FROM articles WHERE hidden = 0').first<{ count: number }>();
  return result?.count || 0;
}

// Get tag count
export async function getTagCount(db: D1Database): Promise<number> {
  const tags = await getAllTags(db);
  return tags.length;
}

// Upsert article
export async function upsertArticle(db: D1Database, article: Omit<Article, 'id'>): Promise<void> {
  await db.prepare(`
    INSERT INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      date = excluded.date,
      updated = excluded.updated,
      description = excluded.description,
      tags = excluded.tags,
      cover = excluded.cover,
      content = excluded.content,
      hidden = excluded.hidden
  `).bind(
    article.slug, article.title, article.date, article.updated || '',
    article.description || '', article.tags || '[]', article.cover || '',
    article.content || '', article.hidden || 0
  ).run();
}

// Delete article
export async function deleteArticle(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM articles WHERE id = ?').bind(id).run();
}

// Toggle hidden
export async function toggleHidden(db: D1Database, id: number): Promise<void> {
  await db.prepare('UPDATE articles SET hidden = CASE WHEN hidden = 0 THEN 1 ELSE 0 END WHERE id = ?').bind(id).run();
}

// Get article content for excerpt
export async function getArticleExcerpt(db: D1Database, slug: string): Promise<string> {
  const row = await db.prepare('SELECT content FROM articles WHERE slug = ?').bind(slug).first<{ content: string }>();
  return row?.content || '';
}
