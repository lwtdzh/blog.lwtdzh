import { ArticleMeta } from "../lib/articles";

function formatDate(dateStr: string): string {
  return dateStr.split('T')[0];
}

export function renderPostPage(
  article: ArticleMeta & { content: string },
  htmlContent: string,
  prev: ArticleMeta | null,
  next: ArticleMeta | null
): string {
  const slug = article.slug;
  const tagsHtml = article.tags.map(tag =>
    `<a href="/tags/${encodeURIComponent(tag)}/" rel="tag"># ${tag}</a>`
  ).join('\n              ');

  const prevHtml = prev
    ? `<div class="post-nav-item">
    <a href="/${prev.slug}/" rel="prev" title="${prev.title}">
      <i class="fa fa-chevron-left"></i> ${prev.title}
    </a></div>`
    : '<div class="post-nav-item"></div>';

  const nextHtml = next
    ? `<div class="post-nav-item">
    <a href="/${next.slug}/" rel="next" title="${next.title}">
      ${next.title} <i class="fa fa-chevron-right"></i>
    </a></div>`
    : '<div class="post-nav-item"></div>';

  return `<div class="content post posts-expand">
  <article itemscope itemtype="http://schema.org/Article" class="post-block" lang="en">
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
      <h1 class="post-title" itemprop="name headline">
        ${article.title}
      </h1>
      <div class="post-meta">
        <span class="post-meta-item">
          <span class="post-meta-item-icon"><i class="far fa-calendar"></i></span>
          <span class="post-meta-item-text">Posted on</span>
          <time title="Created: ${article.date}" itemprop="dateCreated datePublished" datetime="${article.date}">${formatDate(article.date)}</time>
        </span>
        ${article.updated ? `<span class="post-meta-item">
          <span class="post-meta-item-icon"><i class="far fa-calendar-check"></i></span>
          <span class="post-meta-item-text">Edited on</span>
          <time title="Modified: ${article.updated}" itemprop="dateModified" datetime="${article.updated}">${formatDate(article.updated)}</time>
        </span>` : ''}
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
      ${htmlContent}
    </div>
    <footer class="post-footer">
      <div class="post-tags">
        ${tagsHtml}
      </div>
      <div class="post-nav">
        ${prevHtml}
        ${nextHtml}
      </div>
    </footer>
  </article>

  <div class="comments" id="comments-section">
    <div class="comment-form-container">
      <form class="comment-form">
        <div class="comment-form-row">
          <input class="comment-input" name="nickname" placeholder="Nickname *" required>
          <input class="comment-input" name="email" placeholder="Email (for Gravatar)" type="email">
        </div>
        <textarea class="comment-textarea" name="content" placeholder="Write a comment..." required></textarea>
        <button class="comment-submit" type="submit">Submit</button>
      </form>
    </div>
    <div class="comment-list"></div>
  </div>
</div>`;
}
