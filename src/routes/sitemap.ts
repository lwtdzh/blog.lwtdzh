import { Hono } from 'hono';
import { getAllArticles } from '../lib/articles';

const sitemap = new Hono();

sitemap.get('/sitemap.xml', (c) => {
  const articles = getAllArticles();
  const baseUrl = 'https://blog.lwtdzh.ip-ddns.com';

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/archives/</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

  for (const article of articles) {
    const lastmod = article.updated || article.date;
    xml += `
  <url>
    <loc>${baseUrl}/${article.slug}/</loc>
    <lastmod>${lastmod.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  xml += `
</urlset>`;

  return c.text(xml, 200, { 'Content-Type': 'application/xml' });
});

sitemap.get('/robots.txt', (c) => {
  const body = `User-agent: *
Allow: /

Sitemap: https://blog.lwtdzh.ip-ddns.com/sitemap.xml`;
  return c.text(body, 200, { 'Content-Type': 'text/plain' });
});

sitemap.get('/baidusitemap.xml', (c) => {
  const articles = getAllArticles();
  const baseUrl = 'https://blog.lwtdzh.ip-ddns.com';

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  for (const article of articles) {
    const lastmod = article.updated || article.date;
    xml += `
  <url>
    <loc>${baseUrl}/${article.slug}/</loc>
    <lastmod>${lastmod.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  xml += `
</urlset>`;

  return c.text(xml, 200, { 'Content-Type': 'application/xml' });
});

export default sitemap;
