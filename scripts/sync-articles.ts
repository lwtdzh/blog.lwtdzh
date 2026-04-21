/**
 * Sync articles from content/posts/*.md to D1 database.
 * 
 * Usage with wrangler:
 *   npx wrangler d1 execute blog-db --local --file=scripts/sync-articles.sql
 * 
 * Or run this script to generate SQL:
 *   npx tsx scripts/sync-articles.ts > scripts/sync-articles.sql
 */

import * as fs from 'fs';
import * as path from 'path';

interface FrontMatter {
  title: string;
  date: string;
  updated?: string;
  slug: string;
  tags: string[];
  description?: string;
  cover?: string;
  hidden?: boolean;
}

function parseFrontMatter(fileContent: string): { data: FrontMatter; content: string } {
  const match = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error('No front matter found');
  }

  const yamlStr = match[1];
  const content = match[2].trim();

  // Simple YAML parser for our known fields
  const data: any = {};
  const lines = yamlStr.split('\n');
  
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    
    const key = line.substring(0, colonIdx).trim();
    let value = line.substring(colonIdx + 1).trim();
    
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    if (key === 'tags') {
      // Parse JSON array
      try {
        data.tags = JSON.parse(value);
      } catch {
        data.tags = [];
      }
    } else if (key === 'hidden') {
      data.hidden = value === 'true';
    } else {
      data[key] = value;
    }
  }

  return { data: data as FrontMatter, content };
}

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

function main() {
  const postsDir = path.join(process.cwd(), 'content', 'posts');
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

  console.log('-- Auto-generated SQL from sync-articles.ts');
  console.log('-- Run with: npx wrangler d1 execute blog-db --local --file=scripts/sync-articles.sql');
  console.log('');
  console.log(`CREATE TABLE IF NOT EXISTS articles (
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
);`);
  console.log('');
  console.log(`CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  count INTEGER DEFAULT 0
);`);
  console.log('');
  console.log(`CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  nickname TEXT NOT NULL,
  email TEXT DEFAULT '',
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`);
  console.log('');

  for (const file of files) {
    const filePath = path.join(postsDir, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    
    try {
      const { data, content } = parseFrontMatter(raw);
      
      const slug = escapeSQL(data.slug);
      const title = escapeSQL(data.title);
      const date = escapeSQL(data.date);
      const updated = escapeSQL(data.updated || data.date);
      const description = escapeSQL(data.description || '');
      const tags = escapeSQL(JSON.stringify(data.tags || []));
      const cover = escapeSQL(data.cover || '');
      const articleContent = escapeSQL(content);
      const hidden = data.hidden ? 1 : 0;

      console.log(`INSERT OR REPLACE INTO articles (slug, title, date, updated, description, tags, cover, content, hidden)
VALUES ('${slug}', '${title}', '${date}', '${updated}', '${description}', '${tags}', '${cover}', '${articleContent}', ${hidden});`);
      console.log('');
    } catch (e) {
      console.error(`-- ERROR processing ${file}: ${e}`);
    }
  }
}

main();
