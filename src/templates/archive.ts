import { ArticleMeta } from "../lib/articles";

function formatMonthDay(dateStr: string): string {
  const d = new Date(dateStr);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

function getYear(dateStr: string): string {
  return dateStr.split('-')[0] || dateStr.split('T')[0].split('-')[0];
}

export function renderArchivePage(articles: ArticleMeta[], year?: string, month?: string): string {
  const count = articles.length;

  // Group articles by year
  const grouped = new Map<string, ArticleMeta[]>();
  for (const article of articles) {
    const y = getYear(article.date);
    if (!grouped.has(y)) grouped.set(y, []);
    grouped.get(y)!.push(article);
  }

  // Sort years descending
  const sortedYears = Array.from(grouped.keys()).sort((a, b) => parseInt(b) - parseInt(a));

  let articlesHtml = '';
  for (const y of sortedYears) {
    articlesHtml += `
    <div class="collection-year">
      <span class="collection-header">${y}</span>
    </div>`;

    for (const article of grouped.get(y)!) {
      articlesHtml += `
  <article itemscope itemtype="http://schema.org/Article">
    <header class="post-header">
      <div class="post-meta">
        <time itemprop="dateCreated" datetime="${article.date}" content="${article.date.split('T')[0]}">
          ${formatMonthDay(article.date)}
        </time>
      </div>
      <div class="post-title">
        <a class="post-title-link" href="/${article.slug}/" itemprop="url">
          <span itemprop="name">${article.title}</span>
        </a>
      </div>
    </header>
  </article>`;
    }
  }

  let titleHtml: string;
  if (year && month) {
    titleHtml = `<span class="collection-header">Um..! ${count} posts in total. Keep on posting.</span>`;
  } else if (year) {
    titleHtml = `<span class="collection-header">Um..! ${count} posts in total. Keep on posting.</span>`;
  } else {
    titleHtml = `<span class="collection-header">Um..! ${count} posts in total. Keep on posting.</span>`;
  }

  return `<div class="content archive">
  <div class="post-block">
    <div class="posts-collapse">
      <div class="collection-title">
        ${titleHtml}
      </div>
      ${articlesHtml}
    </div>
  </div>
</div>`;
}
