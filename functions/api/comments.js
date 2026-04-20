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
    `CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL,
      nickname TEXT NOT NULL,
      email TEXT DEFAULT '',
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

      if (!slug) {
        return jsonResponse({ error: 'Missing slug parameter' }, 400);
      }

      const { results } = await db.prepare(
        'SELECT id, slug, nickname, email, content, created_at FROM comments WHERE slug = ? ORDER BY created_at DESC'
      ).bind(slug).all();

      return jsonResponse(results);
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const { slug, nickname, email, content } = body;

      if (!slug || !nickname || !content) {
        return jsonResponse({ error: 'Missing required fields: slug, nickname, content' }, 400);
      }

      await db.prepare(
        'INSERT INTO comments (slug, nickname, email, content) VALUES (?, ?, ?, ?)'
      ).bind(slug, nickname, email || '', content).run();

      return jsonResponse({ success: true }, 201);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  } catch (error) {
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
}
