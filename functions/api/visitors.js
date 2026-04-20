export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const db = env.DB;

  // Ensure table exists
  await db.exec(`
    CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      count INTEGER DEFAULT 0
    )
  `);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Handle GET request - get visitor count(s)
  if (request.method === 'GET') {
    const slug = url.searchParams.get('slug');
    const slugs = url.searchParams.get('slugs');

    // Single slug query
    if (slug) {
      const { results } = await db.prepare(
        'SELECT slug, count FROM visitors WHERE slug = ?'
      ).bind(slug).all();

      if (results.length === 0) {
        return new Response(JSON.stringify({ slug, count: 0 }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      return new Response(JSON.stringify({ slug: results[0].slug, count: results[0].count }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Multiple slugs query
    if (slugs) {
      const slugList = slugs.split(',').map(s => s.trim()).filter(s => s);
      
      if (slugList.length === 0) {
        return new Response(JSON.stringify({}), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const placeholders = slugList.map(() => '?').join(',');
      const { results } = await db.prepare(
        `SELECT slug, count FROM visitors WHERE slug IN (${placeholders})`
      ).bind(...slugList).all();

      // Build response object with all requested slugs
      const response = {};
      slugList.forEach(s => {
        const found = results.find(r => r.slug === s);
        response[s] = found ? found.count : 0;
      });

      return new Response(JSON.stringify(response), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Missing slug or slugs parameter' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Handle POST request - increment visitor count
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { slug } = body;

      if (!slug) {
        return new Response(JSON.stringify({ error: 'Missing slug field' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Insert if not exists, then update
      await db.prepare(
        'INSERT OR IGNORE INTO visitors (slug, count) VALUES (?, 0)'
      ).bind(slug).run();

      const result = await db.prepare(
        'UPDATE visitors SET count = count + 1 WHERE slug = ? RETURNING count'
      ).bind(slug).first();

      return new Response(JSON.stringify({ slug, count: result.count }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
