const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

async function ensureTable(db) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      count INTEGER DEFAULT 0
    )`
  ).run();
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const db = env.DB;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    await ensureTable(db);
  } catch (tableError) {
    // Table likely already exists, safe to continue
  }

  try {
    if (request.method === 'GET') {
      const slug = url.searchParams.get('slug');
      const slugs = url.searchParams.get('slugs');

      if (slug) {
        const row = await db.prepare(
          'SELECT count FROM visitors WHERE slug = ?'
        ).bind(slug).first();
        return jsonResponse({ slug, count: row ? row.count : 0 });
      }

      if (slugs) {
        const slugList = slugs.split(',').map(s => s.trim()).filter(s => s);
        if (slugList.length === 0) {
          return jsonResponse({});
        }

        const placeholders = slugList.map(() => '?').join(',');
        const { results } = await db.prepare(
          `SELECT slug, count FROM visitors WHERE slug IN (${placeholders})`
        ).bind(...slugList).all();

        const response = {};
        slugList.forEach(s => {
          const found = results.find(r => r.slug === s);
          response[s] = found ? found.count : 0;
        });
        return jsonResponse(response);
      }

      return jsonResponse({ error: 'Missing slug or slugs parameter' }, 400);
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const { slug } = body;

      if (!slug) {
        return jsonResponse({ error: 'Missing slug field' }, 400);
      }

      await db.prepare(
        'INSERT OR IGNORE INTO visitors (slug, count) VALUES (?, 0)'
      ).bind(slug).run();

      const result = await db.prepare(
        'UPDATE visitors SET count = count + 1 WHERE slug = ? RETURNING count'
      ).bind(slug).first();

      return jsonResponse({ slug, count: result ? result.count : 1 });
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  } catch (error) {
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
}
