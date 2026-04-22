import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const api = new Hono<{ Bindings: Bindings }>();

type CommentRow = {
  id: number;
  slug: string;
  content: string;
  created_at: string;
  commenter_type?: string;
  ip_address?: string;
  country?: string;
  region?: string;
  city?: string;
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function normalizeSlug(value: string | undefined | null): string {
  if (!value) {
    return '';
  }

  let slug = value.trim();
  if (!slug) {
    return '';
  }

  try {
    if (slug.startsWith('http://') || slug.startsWith('https://')) {
      slug = new URL(slug).pathname;
    }
  } catch {
    // Ignore invalid absolute URLs and fall back to the raw value.
  }

  slug = slug.split('#')[0]?.split('?')[0] || slug;
  slug = slug.replace(/^\/+|\/+$/g, '');

  return slug ? `/${slug}/` : '';
}

function normalizeSlugList(value: string | undefined | null): string[] {
  if (!value) {
    return [];
  }

  const normalized = value
    .split(',')
    .map((slug) => normalizeSlug(slug))
    .filter(Boolean);

  return Array.from(new Set(normalized));
}

function sanitizeCountry(country: string): string {
  return country === 'T1' ? 'Tor' : country;
}

function buildLocationLabel(city?: string, region?: string, country?: string): string {
  const parts = [city, region, country].map((part) => part?.trim()).filter(Boolean);
  return parts.join(', ');
}

function getCommenterLabel(commenterType?: string): string {
  return commenterType === 'admin' ? 'Admin' : 'Visitor';
}

function getClientIp(c: any): string {
  const forwarded = c.req.header('cf-connecting-ip')
    || c.req.header('x-forwarded-for')
    || c.req.header('x-real-ip')
    || '';

  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || '';
  }

  return '';
}

function getLocationMetadata(c: any): { country: string; region: string; city: string } {
  const cf = c.req.raw.cf as Record<string, unknown> | undefined;

  return {
    country: sanitizeCountry(typeof cf?.country === 'string' ? cf.country : ''),
    region: typeof cf?.region === 'string' ? cf.region : '',
    city: typeof cf?.city === 'string' ? cf.city : '',
  };
}

// CORS preflight
api.options('*', (c) => {
  return new Response(null, { headers: CORS_HEADERS });
});

// ==================== Visitors API ====================

api.get('/visitors', async (c) => {
  const db = c.env.DB;
  const slug = normalizeSlug(c.req.query('slug'));
  const slugs = normalizeSlugList(c.req.query('slugs'));

  try {
    if (slug) {
      const row = await db.prepare('SELECT count FROM visitors WHERE slug = ?').bind(slug).first<{ count: number }>();
      return c.json({ slug, count: row ? row.count : 0 }, 200, CORS_HEADERS);
    }

    if (slugs.length > 0) {
      if (slugs.length === 0) {
        return c.json({}, 200, CORS_HEADERS);
      }

      const placeholders = slugs.map(() => '?').join(',');
      const { results } = await db.prepare(
        `SELECT slug, count FROM visitors WHERE slug IN (${placeholders})`
      ).bind(...slugs).all();

      const response: Record<string, number> = {};
      slugs.forEach(s => {
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
    const slug = normalizeSlug(body?.slug);

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
  const slug = normalizeSlug(c.req.query('slug'));
  const slugs = normalizeSlugList(c.req.query('slugs'));

  if (slugs.length > 0) {
    try {
      const placeholders = slugs.map(() => '?').join(',');
      const { results } = await db.prepare(
        `SELECT slug, COUNT(*) as count FROM comments WHERE slug IN (${placeholders}) GROUP BY slug`
      ).bind(...slugs).all<{ slug: string; count: number }>();

      const response: Record<string, number> = {};
      slugs.forEach((requestedSlug) => {
        const match = (results || []).find((row: any) => row.slug === requestedSlug);
        response[requestedSlug] = match ? Number((match as any).count || 0) : 0;
      });

      return c.json(response, 200, CORS_HEADERS);
    } catch (error: any) {
      return c.json({ error: error.message || 'Internal server error' }, 500, CORS_HEADERS);
    }
  }

  if (!slug) {
    return c.json({ error: 'Missing slug parameter' }, 400, CORS_HEADERS);
  }

  try {
    const { results } = await db.prepare(
      'SELECT id, slug, content, created_at, commenter_type, ip_address, country, region, city FROM comments WHERE slug = ? ORDER BY datetime(created_at) DESC, id DESC'
    ).bind(slug).all<CommentRow>();

    const publicComments = (results || []).map((comment) => ({
      id: comment.id,
      slug: comment.slug,
      author: getCommenterLabel(comment.commenter_type),
      commenter_type: comment.commenter_type || 'visitor',
      content: comment.content,
      created_at: comment.created_at,
      ip_address: comment.ip_address?.trim() || undefined,
      location: buildLocationLabel(comment.city, comment.region, comment.country) || undefined,
    }));

    return c.json(publicComments, 200, CORS_HEADERS);
  } catch (error: any) {
    return c.json({ error: error.message || 'Internal server error' }, 500, CORS_HEADERS);
  }
});

api.post('/comments', async (c) => {
  const db = c.env.DB;
  try {
    const body = await c.req.json();
    const slug = normalizeSlug(body?.slug);
    const content = typeof body?.content === 'string' ? body.content.trim() : '';

    if (!slug || !content) {
      return c.json({ error: 'Missing required fields: slug, content' }, 400, CORS_HEADERS);
    }

    if (content.length > 5000) {
      return c.json({ error: 'Comment is too long' }, 400, CORS_HEADERS);
    }

    const commenterType = 'visitor';
    const ipAddress = getClientIp(c);
    const location = getLocationMetadata(c);

    await db.prepare(
      'INSERT INTO comments (slug, nickname, email, commenter_type, ip_address, country, region, city, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(slug, 'Visitor', '', commenterType, ipAddress, location.country, location.region, location.city, content).run();

    return c.json({ success: true }, 201, CORS_HEADERS);
  } catch (error: any) {
    return c.json({ error: error.message || 'Internal server error' }, 500, CORS_HEADERS);
  }
});

export default api;
