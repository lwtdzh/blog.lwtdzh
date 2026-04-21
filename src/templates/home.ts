import { ArticleMeta } from "../lib/articles";

function formatDate(dateStr: string): string {
  // Format date as YYYY-MM-DD
  return dateStr.split('T')[0];
}

export function renderHomePage(articles: ArticleMeta[], excerpts: Map<string, string>, page: number, totalPages: number): string {
  const articlesHtml = articles.map(article => {
    const excerpt = excerpts.get(article.slug) || '';
    const slug = article.slug;
    
    return `<article itemscope itemtype="http://schema.org/Article" class="post-block" lang="en">
  <link itemprop="mainEntityOfPage" href="https://blog.lwtdzh.ip-ddns.com/${slug}/">
  <span hidden itemprop="author" itemscope itemtype="http://schema.org/Person">
    <meta itemprop="image" content="/images/avatar.gif">
    <meta itemprop="name" content="lwtdzh">
    <meta itemprop="description" content>
  </span>
  <span hidden itemprop="publisher" itemscope itemtype="http://schema.org/Organization">
    <meta itemprop="name" content="Lwtdzh's Blog">
  </span>
  <header class="post-header">
    <h2 class="post-title" itemprop="name headline">
      <a href="/${slug}/" class="post-title-link" itemprop="url">${article.title}</a>
    </h2>
    <div class="post-meta">
      <span class="post-meta-item">
        <span class="post-meta-item-icon"><i class="far fa-calendar"></i></span>
        <span class="post-meta-item-text">Posted on</span>
        <time title="Created: ${article.date}" itemprop="dateCreated datePublished" datetime="${article.date}">${formatDate(article.date)}</time>
      </span>
      <span id="/${slug}/" class="post-meta-item leancloud_visitors" data-flag-title="${article.title}" title="Views">
        <span class="post-meta-item-icon"><i class="fa fa-eye"></i></span>
        <span class="post-meta-item-text">Views: </span>
        <span class="leancloud-visitors-count"></span>
      </span>
      <span class="post-meta-item">
        <span class="post-meta-item-icon"><i class="far fa-comment"></i></span>
        <span class="post-meta-item-text">Comments: </span>
        <a title="valine" href="/${slug}/#comments-section" itemprop="discussionUrl">
          <span class="post-comments-count valine-comment-count" data-xid="/${slug}/" itemprop="commentCount"></span>
        </a>
      </span>
    </div>
  </header>
  <div class="post-body" itemprop="articleBody">
    ${excerpt}
    <!--noindex-->
    <div class="post-button">
      <a class="btn" href="/${slug}/#more" rel="contents">Read more »</a>
    </div>
    <!--/noindex-->
  </div>
  <footer class="post-footer"><div class="post-eof"></div></footer>
</article>`;
  }).join('\n\n');

  // Generate pagination
  let paginationHtml = '';
  if (totalPages > 1) {
    const pages: string[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === page) {
        pages.push(`<span class="page-number current">${i}</span>`);
      } else {
        pages.push(`<a class="page-number" href="/page/${i}/">${i}</a>`);
      }
    }
    
    const prevLink = page > 1 ? `<a class="extend prev" rel="prev" href="/page/${page - 1}/">&laquo; Prev</a>` : '';
    const nextLink = page < totalPages ? `<a class="extend next" rel="next" href="/page/${page + 1}/">Next &raquo;</a>` : '';
    
    paginationHtml = `<nav class="pagination">
  ${prevLink}
  ${pages.join('')}
  ${nextLink}
</nav>`;
  }

  return `<div class="content index posts-expand">
  ${articlesHtml}
  ${paginationHtml}
</div>`;
}
