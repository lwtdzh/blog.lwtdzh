import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const api = new Hono<{ Bindings: Bindings }>();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// CORS preflight
api.options('*', (c) => {
  return new Response(null, { headers: CORS_HEADERS });
});

// ==================== Visitors API ====================

api.get('/visitors', async (c) => {
  const db = c.env.DB;
  const slug = c.req.query('slug');
  const slugs = c.req.query('slugs');

  try {
    if (slug) {
      const row = await db.prepare('SELECT count FROM visitors WHERE slug = ?').bind(slug).first<{ count: number }>();
      return c.json({ slug, count: row ? row.count : 0 }, 200, CORS_HEADERS);
    }

    if (slugs) {
      const slugList = slugs.split(',').map(s => s.trim()).filter(s => s);
      if (slugList.length === 0) {
        return c.json({}, 200, CORS_HEADERS);
      }

      const placeholders = slugList.map(() => '?').join(',');
      const { results } = await db.prepare(
        `SELECT slug, count FROM visitors WHERE slug IN (${placeholders})`
      ).bind(...slugList).all();

      const response: Record<string, number> = {};
      slugList.forEach(s => {
        const found = (results || []).find((r: any) => r.slug === s);
        response[s] = found ? (found as any).count : 0;
      });
      return c.json(response, 200, CORS_HEADERS);
    }

    return c.json({ error: 'Missing slug or slugs parameter' }, 400, CORS_HEADERS);
  } catch (error: any) {
    return c.json({ error: error.message || 'Internal server error' }, 500, CORS_HEADERS);
  }
});

api.post('/visitors', async (c) => {
  const db = c.env.DB;
  try {
    const body = await c.req.json();
    const { slug } = body;

    if (!slug) {
      return c.json({ error: 'Missing slug field' }, 400, CORS_HEADERS);
    }

    await db.prepare('INSERT OR IGNORE INTO visitors (slug, count) VALUES (?, 0)').bind(slug).run();
    const result = await db.prepare(
      'UPDATE visitors SET count = count + 1 WHERE slug = ? RETURNING count'
    ).bind(slug).first<{ count: number }>();

    return c.json({ slug, count: result ? result.count : 1 }, 200, CORS_HEADERS);
  } catch (error: any) {
    return c.json({ error: error.message || 'Internal server error' }, 500, CORS_HEADERS);
  }
});

// ==================== Comments API ====================

api.get('/comments', async (c) => {
  const db = c.env.DB;
  const slug = c.req.query('slug');

  if (!slug) {
    return c.json({ error: 'Missing slug parameter' }, 400, CORS_HEADERS);
  }

  try {
    const { results } = await db.prepare(
      'SELECT id, slug, nickname, email, content, created_at FROM comments WHERE slug = ? ORDER BY created_at DESC'
    ).bind(slug).all();

    return c.json(results || [], 200, CORS_HEADERS);
  } catch (error: any) {
    return c.json({ error: error.message || 'Internal server error' }, 500, CORS_HEADERS);
  }
});

api.post('/comments', async (c) => {
  const db = c.env.DB;
  try {
    const body = await c.req.json();
    const { slug, nickname, email, content } = body;

    if (!slug || !nickname || !content) {
      return c.json({ error: 'Missing required fields: slug, nickname, content' }, 400, CORS_HEADERS);
    }

    await db.prepare(
      'INSERT INTO comments (slug, nickname, email, content) VALUES (?, ?, ?, ?)'
    ).bind(slug, nickname, email || '', content).run();

    return c.json({ success: true }, 201, CORS_HEADERS);
  } catch (error: any) {
    return c.json({ error: error.message || 'Internal server error' }, 500, CORS_HEADERS);
  }
});

export default api;