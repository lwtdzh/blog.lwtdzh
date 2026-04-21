import { ArticleMeta } from './articles';
import { renderMarkdown, getExcerpt as getExcerptFromContent } from './markdown';

export interface PageContext {
  title: string;
  description?: string;
  keywords?: string;
  isHome?: boolean;
  isPost?: boolean;
  isArchive?: boolean;
  isTag?: boolean;
  currentUrl?: string;
}

export function renderLayout(content: string, ctx: PageContext): string {
  const title = ctx.title || "Lwtdzh's Blog";
  const description = ctx.description || "中日双语字幕分享、日语学习资源、动漫字幕下载。Chinese-Japanese bilingual subtitles, anime subtitle downloads.";
  const keywords = ctx.keywords || "中日双语字幕,日语字幕,动漫字幕,bilingual subtitles,Japanese subtitles,anime subtitles,lwtdzh";
  const currentUrl = ctx.currentUrl || '/';
  
  const pageConfig = JSON.stringify({
    sidebar: "",
    isHome: ctx.isHome || false,
    isPost: ctx.isPost || false,
    lang: 'zh-CN'
  });

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2">
<meta name="theme-color" content="#222">
<meta name="author" content="lwtdzh">
<meta name="generator" content="Hono + Cloudflare Pages">
  <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon-next.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32-next.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16-next.png">
  <link rel="mask-icon" href="/images/logo.svg" color="#222">

<link rel="stylesheet" href="/css/main.css">

<link rel="stylesheet" href="/lib/font-awesome/css/all.min.css">

<script id="hexo-configurations">
    var NexT = window.NexT || {};
    var CONFIG = {"hostname":"blog.lwtdzh.ip-ddns.com","root":"/","scheme":"Pisces","version":"7.8.0","exturl":false,"sidebar":{"position":"left","display":"post","padding":18,"offset":12,"onmobile":false},"copycode":{"enable":false,"show_result":false,"style":null},"back2top":{"enable":true,"sidebar":false,"scrollpercent":false},"bookmark":{"enable":false,"color":"#222","save":"auto"},"fancybox":false,"mediumzoom":false,"lazyload":false,"pangu":false,"comments":{"style":"tabs","active":null,"storage":true,"lazyload":false,"nav":null},"algolia":{"hits":{"per_page":10},"labels":{"input_placeholder":"Search for Posts","hits_empty":"We didn't find any results for the search: \${query}","hits_stats":"\${hits} results found in \${time} ms"}},"localsearch":{"enable":false,"trigger":"auto","top_n_per_article":1,"unescape":false,"preload":false},"motion":{"enable":false,"async":false,"transition":{"post_block":"fadeIn","post_header":"slideDownIn","post_body":"slideDownIn","coll_header":"slideLeftIn","sidebar":"slideUpIn"}}};
  </script>

  <meta name="description" content="${escapeHtml(description)}">
<meta name="keywords" content="${escapeHtml(keywords)}">
<meta property="og:type" content="${ctx.isPost ? 'article' : 'website'}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="https://blog.lwtdzh.ip-ddns.com${currentUrl}">
<meta property="og:site_name" content="Lwtdzh's Blog">
<meta property="og:locale" content="zh_CN">
<meta property="article:author" content="lwtdzh">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">

<link rel="canonical" href="https://blog.lwtdzh.ip-ddns.com${currentUrl}">

<script id="page-configurations">
  CONFIG.page = ${pageConfig};
</script>

  <title>${escapeHtml(title)}</title>
  

  <noscript>
  <style>
  .use-motion .brand,
  .use-motion .menu-item,
  .sidebar-inner,
  .use-motion .post-block,
  .use-motion .pagination,
  .use-motion .comments,
  .use-motion .post-header,
  .use-motion .post-body,
  .use-motion .collection-header { opacity: initial; }

  .use-motion .site-title,
  .use-motion .site-subtitle {
    opacity: initial;
    top: initial;
  }

  .use-motion .logo-line-before i { left: initial; }
  .use-motion .logo-line-after i { right: initial; }
  </style>
</noscript>

<meta name="shenma-site-verification" content="136a7c5fb5356dea89b9bb68bd7b7742_1734701671"><meta name="baidu-site-verification" content="codeva-e28AqD3F1C"><meta name="sogou_site_verification" content="2uG2AWf4qU"></head>

<body itemscope itemtype="http://schema.org/WebPage">
  <div class="container">
    <div class="headband"></div>

    <header class="header" itemscope itemtype="http://schema.org/WPHeader">
      <div class="header-inner"><div class="site-brand-container">
  <div class="site-nav-toggle">
    <div class="toggle" aria-label="Toggle navigation bar">
      <span class="toggle-line toggle-line-first"></span>
      <span class="toggle-line toggle-line-middle"></span>
      <span class="toggle-line toggle-line-last"></span>
    </div>
  </div>

  <div class="site-meta">

    <a href="/" class="brand" rel="start">
      <span class="logo-line-before"><i></i></span>
      <h1 class="brand-title">Lwtdzh's Blog</h1>
      <span class="logo-line-after"><i></i></span>
    </a>
  </div>

  <div class="site-nav-right">
    <div class="toggle sidebar-toggle">
      <span class="toggle-line toggle-line-first"></span>
      <span class="toggle-line toggle-line-middle"></span>
      <span class="toggle-line toggle-line-last"></span>
    </div>
  </div>
</div>




<nav class="site-nav">
  <ul class="main-menu menu"><li class="menu-item menu-item-home"><a href="/" rel="section"><i class="fa fa-home fa-fw"></i>Home</a></li><li class="menu-item menu-item-archives"><a href="/archives/" rel="section"><i class="fa fa-archive fa-fw"></i>Archives</a></li>
  </ul>
</nav>




</div>
    </header>

    
  <div class="back-to-top">
    <i class="fa fa-arrow-up"></i>
    <span>0%</span>
  </div>


    <main class="main">
      <div class="main-inner">
        ${content}
      </div>
    </main>

    
  <footer class="footer">
    <div class="footer-inner">
      <div class="copyright">&copy; <span itemprop="copyrightYear">2026</span>
  <span class="with-love">
    <i class="fa fa-heart"></i>
  </span>
  <span class="author" itemprop="copyrightHolder">lwtdzh</span>
</div>
    </div>
  </footer>

<script src="/js/utils.js"></script>
<script src="/js/next-boot.js"></script>
<script src="/js/bookmark.js"></script>
<script src="/js/motion.js"></script>
<script src="/js/schemes/pisces.js"></script>
<script src="/js/local-search.js"></script>
<script src="/js/visitors.js"></script>
<script src="/js/comments.js"></script>

</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderHomePage(articles: ArticleMeta[], currentPage: number, totalPages: number, postCount: number, tagCount: number): string {
  const articlesHtml = articles.map(article => {
    const date = new Date(article.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const url = `/${year}/${month}/${day}/posts/${article.slug}/`;
    const tagsHtml = article.tags.map(tag => 
      `<span class="post-tag"><a href="/tags/${encodeURIComponent(tag)}/">${escapeHtml(tag)}</a></span>`
    ).join('');
    
    return `
<article class="post post-type-normal" itemscope itemtype="http://schema.org/Article">
  <header class="post-header">
    <h2 class="post-title" itemprop="name headline">
      <a class="post-title-link" href="${url}" itemprop="url">
        <span itemprop="name">${escapeHtml(article.title)}</span>
      </a>
    </h2>

    <div class="post-meta">
      <span class="post-time">
        <span class="post-meta-item-icon">
          <i class="fa fa-calendar-o"></i>
        </span>
        <span class="post-meta-item-text">Posted on</span>
        <time title="Created: ${article.date}" itemprop="dateCreated datePublished" datetime="${article.date}">
          ${article.date}
        </time>
      </span>

      <span class="post-tags">
        <span class="post-meta-item-icon">
          <i class="fa fa-tag"></i>
        </span>
        <span class="post-meta-item-text">Tags:</span>
        ${tagsHtml}
      </span>
    </div>
  </header>

  <div class="post-body" itemprop="articleBody">
    <p>${escapeHtml(article.description)}</p>
    <div class="post-more-link">
      <a href="${url}">Read more &raquo;</a>
    </div>
  </div>

  <footer class="post-footer">
    <div class="post-nav">
      <div class="post-nav-next post-nav-item">
      </div>

      <div class="post-nav-prev post-nav-item">
      </div>
    </div>
  </footer>
</article>
    `;
  }).join('');

  const paginationHtml = totalPages > 1 ? `
    <nav class="pagination">
      ${currentPage > 1 ? `<a class="extend prev" rel="prev" href="/page/${currentPage - 1}/"><i class="fa fa-angle-left"></i></a>` : ''}
      ${Array.from({ length: totalPages }, (_, i) => i + 1).map(page => 
        page === currentPage 
          ? `<span class="page-number current">${page}</span>`
          : `<a class="page-number" href="/page/${page}/">${page}</a>`
      ).join('')}
      ${currentPage < totalPages ? `<a class="extend next" rel="next" href="/page/${currentPage + 1}/"><i class="fa fa-angle-right"></i></a>` : ''}
    </nav>
  ` : '';

  const content = `
<div class="posts-expand">
  ${articlesHtml}
</div>

${paginationHtml}

<div class="sidebar-toggle">
  <div class="sidebar-toggle-line-wrap">
    <span class="sidebar-toggle-line sidebar-toggle-line-first"></span>
    <span class="sidebar-toggle-line sidebar-toggle-line-middle"></span>
    <span class="sidebar-toggle-line sidebar-toggle-line-last"></span>
  </div>
</div>

<aside class="sidebar">
  <div class="sidebar-inner">
    <ul class="sidebar-nav motion-element">
      <li class="sidebar-nav-toc sidebar-nav-active" data-target="post-toc-wrap">
        Table of Contents
      </li>
      <li class="sidebar-nav-overview" data-target="site-overview-wrap">
        Overview
      </li>
    </ul>

    <section class="site-overview sidebar-panel">
      <div class="site-author motion-element" itemprop="author" itemscope itemtype="http://schema.org/Person">
        <img class="site-author-image" itemprop="image" alt="lwtdzh" src="/images/avatar.gif">
        <p class="site-author-name" itemprop="name">lwtdzh</p>
        <div class="site-description" itemprop="description">中日双语字幕分享、日语学习资源、动漫字幕下载。</div>
      </div>
      <nav class="site-state motion-element">
        <div class="site-state-item site-state-posts">
          <a href="/archives/">
            <span class="site-state-item-count">${postCount}</span>
            <span class="site-state-item-name">posts</span>
          </a>
        </div>
        <div class="site-state-item site-state-tags">
          <a href="/archives/">
            <span class="site-state-item-count">${tagCount}</span>
            <span class="site-state-item-name">tags</span>
          </a>
        </div>
      </nav>
    </section>
  </div>
</aside>
  `;

  return renderLayout(content, {
    title: "Lwtdzh's Blog",
    isHome: true,
    currentUrl: currentPage === 1 ? '/' : `/page/${currentPage}/`
  });
}

export function renderPostPage(article: ArticleMeta & { content: string }, prev: ArticleMeta | null, next: ArticleMeta | null, postCount: number, tagCount: number): string {
  const date = new Date(article.date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const url = `/${year}/${month}/${day}/posts/${article.slug}/`;
  
  const tagsHtml = article.tags.map(tag => 
    `<span class="post-tag"><a href="/tags/${encodeURIComponent(tag)}/">${escapeHtml(tag)}</a></span>`
  ).join('');

  const contentHtml = renderMarkdown(article.content);

  const prevLink = prev ? `<a href="/${new Date(prev.date).getFullYear()}/${String(new Date(prev.date).getMonth() + 1).padStart(2, '0')}/${String(new Date(prev.date).getDate()).padStart(2, '0')}/posts/${prev.slug}/" rel="prev" title="${escapeHtml(prev.title)}"><i class="fa fa-chevron-left"></i> ${escapeHtml(prev.title)}</a>` : '';
  const nextLink = next ? `<a href="/${new Date(next.date).getFullYear()}/${String(new Date(next.date).getMonth() + 1).padStart(2, '0')}/${String(new Date(next.date).getDate()).padStart(2, '0')}/posts/${next.slug}/" rel="next" title="${escapeHtml(next.title)}">${escapeHtml(next.title)} <i class="fa fa-chevron-right"></i></a>` : '';

  const content = `
<div class="post-block">
  <article class="post post-type-normal" itemscope itemtype="http://schema.org/Article">
    <header class="post-header">
      <h1 class="post-title" itemprop="name headline">${escapeHtml(article.title)}</h1>

      <div class="post-meta">
        <span class="post-time">
          <span class="post-meta-item-icon">
            <i class="fa fa-calendar-o"></i>
          </span>
          <span class="post-meta-item-text">Posted on</span>
          <time title="Created: ${article.date}" itemprop="dateCreated datePublished" datetime="${article.date}">
            ${article.date}
          </time>
        </span>

        <span class="post-tags">
          <span class="post-meta-item-icon">
            <i class="fa fa-tag"></i>
          </span>
          <span class="post-meta-item-text">Tags:</span>
          ${tagsHtml}
        </span>

        <span class="post-visitors">
          <span class="post-meta-item-icon">
            <i class="fa fa-eye"></i>
          </span>
          <span class="post-meta-item-text">Visitors</span>
        </span>
      </div>
    </header>

    <div class="post-body" itemprop="articleBody">
      ${contentHtml}
    </div>

    <footer class="post-footer">
      <div class="post-nav">
        ${prevLink}
        ${nextLink}
      </div>
    </footer>
  </article>
</div>
  `;

  return renderLayout(content, {
    title: article.title,
    isPost: true,
    currentUrl: url
  });
}