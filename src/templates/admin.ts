import { ArticleMeta } from '../lib/articles';
import { renderMarkdown } from '../lib/markdown';

export type AdminCommentSummary = {
  id: number;
  slug: string;
  articleTitle: string;
  nickname: string;
  email?: string;
  content: string;
  createdAt: string;
  locationSummary?: string;
  ipAddress?: string;
};

export type AdminArticleSummary = ArticleMeta & {
  sourcePath?: string;
};

export type AdminArticleEditorValue = {
  sourcePath?: string;
  title: string;
  dateValue: string;
  slug: string;
  tags: string;
  description: string;
  cover: string;
  hidden: boolean;
  body: string;
  isNew: boolean;
};

type DashboardOptions = {
  githubBacked: boolean;
};

const adminStyle = `
  :root {
    color-scheme: light;
  }
  * {
    box-sizing: border-box;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 24px;
    background: #f5f7fb;
    color: #1f2937;
  }
  a {
    color: #0f5bd8;
  }
  .admin-header {
    background: #172132;
    color: white;
    padding: 18px 22px;
    margin: -24px -24px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .admin-header h1 {
    margin: 0;
    font-size: 20px;
  }
  .header-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  .header-actions a {
    color: #d3dcf3;
    text-decoration: none;
  }
  .admin-container,
  .editor-container {
    max-width: 1180px;
    margin: 0 auto;
  }
  .card {
    background: white;
    border-radius: 12px;
    padding: 22px;
    margin-bottom: 22px;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
    flex-wrap: wrap;
  }
  .card-header h3 {
    margin: 0;
  }
  .info-box,
  .notice-box,
  .warning-box {
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 18px;
    font-size: 14px;
    line-height: 1.6;
  }
  .info-box {
    background: #edf5ff;
    border: 1px solid #cfe0ff;
    color: #22467b;
  }
  .notice-box {
    background: #eefbf0;
    border: 1px solid #c7e7ce;
    color: #226239;
  }
  .warning-box,
  .error {
    background: #fff4e5;
    border: 1px solid #f0c98d;
    color: #8a5a12;
  }
  .table-wrap {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    text-align: left;
    padding: 12px 10px;
    border-bottom: 1px solid #edf1f7;
    vertical-align: top;
  }
  th {
    background: #f8fafc;
    font-weight: 600;
    color: #334155;
  }
  .table-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 9px 14px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
  }
  .btn-primary {
    background: #0f5bd8;
    color: white;
  }
  .btn-secondary {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
  }
  .btn-muted {
    background: #eef2f7;
    color: #233247;
  }
  .btn-danger {
    background: #c0392b;
    color: white;
  }
  .status-hidden {
    color: #8b95a1;
    font-style: italic;
  }
  .status-visible {
    color: #14803f;
    font-weight: 600;
  }
  .status-live {
    color: #0f5bd8;
    font-size: 12px;
    font-weight: 600;
  }
  .login-box {
    max-width: 420px;
    margin: 96px auto;
  }
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #334155;
  }
  input[type="password"],
  input[type="text"],
  input[type="url"],
  input[type="datetime-local"],
  textarea {
    width: 100%;
    font: inherit;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    padding: 10px 12px;
    background: white;
    color: #1f2937;
  }
  input[type="checkbox"] {
    margin-right: 8px;
  }
  textarea {
    min-height: 260px;
    resize: vertical;
  }
  .field-hint {
    margin-top: 6px;
    font-size: 12px;
    color: #64748b;
  }
  .comment-author {
    font-weight: 600;
    margin-bottom: 4px;
  }
  .comment-email,
  .comment-meta,
  .comment-slug {
    color: #64748b;
    font-size: 12px;
  }
  .comment-body {
    margin-top: 8px;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.45;
  }
  .empty-state {
    color: #64748b;
    margin: 0;
  }
  .inline-form {
    display: inline;
    margin: 0;
  }
  .editor-form {
    display: grid;
    gap: 18px;
  }
  .editor-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  .editor-grid .full-width {
    grid-column: 1 / -1;
  }
  .toggle-row {
    display: flex;
    align-items: center;
    min-height: 44px;
  }
  .editor-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .editor-actions-group {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .editor-preview-note {
    margin: 0;
    font-size: 13px;
    color: #64748b;
  }
  .EasyMDEContainer .CodeMirror,
  .EasyMDEContainer .editor-toolbar {
    border-color: #cbd5e1;
  }
  .EasyMDEContainer .CodeMirror {
    min-height: 420px;
  }
  .editor-preview-side,
  .editor-preview {
    background: #fbfcfe;
  }
  .article-path {
    color: #64748b;
    font-size: 12px;
    margin-top: 4px;
    word-break: break-all;
  }
  .preview-shell {
    display: none;
  }
  @media (max-width: 900px) {
    .editor-grid {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 640px) {
    body {
      padding: 16px;
    }
    .admin-header {
      margin: -16px -16px 18px;
      padding: 16px;
    }
    .card {
      padding: 18px;
    }
  }
`;

function renderShell(
  title: string,
  body: string,
  options?: {
    includeFontAwesome?: boolean;
    includeEasyMDE?: boolean;
    includeEditorScript?: boolean;
  },
): string {
  const includeFontAwesome = options?.includeFontAwesome ?? false;
  const includeEasyMDE = options?.includeEasyMDE ?? false;
  const includeEditorScript = options?.includeEditorScript ?? false;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  ${includeFontAwesome ? '<link rel="stylesheet" href="/lib/font-awesome/css/all.min.css">' : ''}
  ${includeEasyMDE ? '<link rel="stylesheet" href="/lib/easymde/easymde.min.css">' : ''}
  <style>${adminStyle}</style>
</head>
<body>
  ${body}
  ${includeEasyMDE ? '<script src="/lib/easymde/easymde.min.js"></script>' : ''}
  ${includeEditorScript ? '<script src="/js/admin-article-editor.js"></script>' : ''}
</body>
</html>`;
}

export function renderLoginPage(error?: string, notice?: string): string {
  return renderShell(
    'Admin Login',
    `<div class="login-box">
      <div class="card">
        <h2>Admin Login</h2>
        ${notice ? `<div class="notice-box">${escapeHtml(notice)}</div>` : ''}
        ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
        <form method="POST" action="/admin/login">
          <label for="password">Password</label>
          <input type="password" name="password" id="password" required autofocus>
          <button type="submit" class="btn btn-primary" style="width:100%;margin-top:12px;">Login</button>
        </form>
      </div>
    </div>`,
  );
}

export function renderDashboard(
  articles: AdminArticleSummary[],
  comments: AdminCommentSummary[],
  notice?: string,
  error?: string,
  options: DashboardOptions = { githubBacked: false },
): string {
  const rows = articles
    .map((article) => {
      const actions = article.sourcePath
        ? `<div class="table-actions">
            <a
              class="btn btn-muted"
              href="/admin/articles/edit?path=${encodeURIComponent(article.sourcePath)}"
              data-testid="edit-article-link"
            >
              Edit
            </a>
            <form method="POST" action="/admin/articles/delete" class="inline-form" onsubmit="return confirm('Delete this article?');">
              <input type="hidden" name="sourcePath" value="${escapeHtml(article.sourcePath)}">
              <input type="hidden" name="title" value="${escapeHtml(article.title)}">
              <button type="submit" class="btn btn-danger" data-testid="delete-article-button">Delete</button>
            </form>
          </div>`
        : '<span class="comment-meta">GitHub editing unavailable</span>';

      return `
        <tr data-source-path="${escapeHtml(article.sourcePath || '')}">
          <td>
            <a href="/${article.slug}/" target="_blank">${escapeHtml(article.title)}</a>
            ${article.sourcePath ? `<div class="article-path">${escapeHtml(article.sourcePath)}</div>` : ''}
          </td>
          <td>${escapeHtml(article.date.split('T')[0] || article.date)}</td>
          <td>${escapeHtml(article.tags.join(', '))}</td>
          <td class="${article.hidden ? 'status-hidden' : 'status-visible'}">${article.hidden ? 'Hidden' : 'Visible'}</td>
          <td>${actions}</td>
        </tr>`;
    })
    .join('');

  const commentRows = comments
    .map(
      (comment) => `
        <tr>
          <td>
            <a href="${commentUrl(comment.slug)}" target="_blank">${escapeHtml(comment.articleTitle)}</a>
            <div class="comment-slug">${escapeHtml(normalizeDisplaySlug(comment.slug))}</div>
          </td>
          <td>
            <div class="comment-author">${escapeHtml(comment.nickname)}</div>
            ${comment.email ? `<div class="comment-email">${escapeHtml(comment.email)}</div>` : ''}
            <div class="comment-body">${escapeHtml(comment.content)}</div>
          </td>
          <td class="comment-meta">${formatAdminDateTime(comment.createdAt)}</td>
          <td class="comment-meta">${escapeHtml(comment.locationSummary || '-')}</td>
          <td class="comment-meta">${escapeHtml(comment.ipAddress || '-')}</td>
          <td>
            <form method="POST" action="/admin/comments/delete" class="inline-form" onsubmit="return confirm('Delete this comment?');">
              <input type="hidden" name="commentId" value="${comment.id}">
              <button type="submit" class="btn btn-danger">Delete</button>
            </form>
          </td>
        </tr>`,
    )
    .join('');

  return renderShell(
    'Admin Dashboard',
    `<div class="admin-header">
      <h1>Blog Admin</h1>
      <div class="header-actions">
        <a href="/" target="_blank">View Site</a>
        <form method="POST" action="/admin/logout" class="inline-form">
          <button type="submit" class="btn btn-secondary">Logout</button>
        </form>
      </div>
    </div>
    <div class="admin-container">
      ${notice ? `<div class="notice-box">${escapeHtml(notice)}</div>` : ''}
      ${error ? `<div class="warning-box">${escapeHtml(error)}</div>` : ''}
      <div class="info-box">
        Articles are stored as Markdown files in <code>content/posts/</code> and saved directly to GitHub main.
        ${options.githubBacked ? '<span class="status-live">Live GitHub article list enabled.</span>' : ''}
      </div>
      <div class="card">
        <div class="card-header">
          <h3>Articles (${articles.length})</h3>
          ${options.githubBacked ? '<a href="/admin/articles/new" class="btn btn-primary" data-testid="new-article-button">New Article</a>' : ''}
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Tags</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <h3>Recent Comments (${comments.length})</h3>
        </div>
        ${comments.length === 0 ? '<p class="empty-state">No comments yet.</p>' : `
          <div class="table-wrap">
            <table>
              <thead><tr><th>Article</th><th>Comment</th><th>Created</th><th>Location</th><th>IP</th><th>Action</th></tr></thead>
              <tbody>${commentRows}</tbody>
            </table>
          </div>`}
      </div>
    </div>`,
  );
}

export function renderArticleEditorPage(
  article: AdminArticleEditorValue,
  notice?: string,
  error?: string,
): string {
  const pageTitle = article.isNew ? 'New Article' : `Edit Article: ${article.title}`;
  const viewArticleLink = article.slug
    ? `<a href="/${escapeHtml(article.slug)}/" target="_blank">View Article</a>`
    : '';

  const previewHtml = article.body ? renderMarkdown(article.body) : '<p>Start writing to see the preview.</p>';
  const deleteForm = article.sourcePath
    ? `
      <form id="delete-article-form" method="POST" action="/admin/articles/delete" onsubmit="return confirm('Delete this article?');">
        <input type="hidden" name="sourcePath" value="${escapeHtml(article.sourcePath)}">
        <input type="hidden" name="title" value="${escapeHtml(article.title)}">
      </form>
    `
    : '';

  return renderShell(
    pageTitle,
    `<div class="admin-header">
      <h1>${escapeHtml(pageTitle)}</h1>
      <div class="header-actions">
        <a href="/admin/dashboard">Back to Dashboard</a>
        ${viewArticleLink}
        <form method="POST" action="/admin/logout" class="inline-form">
          <button type="submit" class="btn btn-secondary">Logout</button>
        </form>
      </div>
    </div>
    <div class="editor-container">
      ${notice ? `<div class="notice-box">${escapeHtml(notice)}</div>` : ''}
      ${error ? `<div class="warning-box">${escapeHtml(error)}</div>` : ''}
      <div class="card">
        <form method="POST" action="/admin/articles/save" class="editor-form" data-testid="article-editor-form">
          ${article.sourcePath ? `<input type="hidden" name="sourcePath" value="${escapeHtml(article.sourcePath)}">` : ''}
          <div class="editor-grid">
            <div class="full-width">
              <label for="article-title">Title</label>
              <input type="text" id="article-title" name="title" value="${escapeHtml(article.title)}" required data-testid="article-title-input">
            </div>
            <div>
              <label for="article-date">Published At</label>
              <input type="datetime-local" id="article-date" name="date" step="1" value="${escapeHtml(article.dateValue)}" required data-testid="article-date-input">
            </div>
            <div class="toggle-row">
              <label for="article-hidden" style="margin-bottom:0;">
                <input type="checkbox" id="article-hidden" name="hidden" ${article.hidden ? 'checked' : ''} data-testid="article-hidden-input">
                Hidden article
              </label>
            </div>
            <div class="full-width">
              <label for="article-slug">Slug</label>
              <input type="text" id="article-slug" name="slug" value="${escapeHtml(article.slug)}" required data-testid="article-slug-input">
              <p class="field-hint">Use the full site path without leading/trailing slashes, for example <code>2026/04/22/notes/my-article</code>.</p>
            </div>
            <div class="full-width">
              <label for="article-tags">Tags</label>
              <input type="text" id="article-tags" name="tags" value="${escapeHtml(article.tags)}" placeholder="anime, subtitles, notes" data-testid="article-tags-input">
            </div>
            <div class="full-width">
              <label for="article-description">Description</label>
              <textarea id="article-description" name="description" rows="3" data-testid="article-description-input">${escapeHtml(article.description)}</textarea>
            </div>
            <div class="full-width">
              <label for="article-cover">Cover URL</label>
              <input type="url" id="article-cover" name="cover" value="${escapeHtml(article.cover)}" data-testid="article-cover-input">
            </div>
            <div class="full-width">
              <label for="article-body">Markdown Body</label>
              <textarea id="article-body" name="body" required data-testid="article-body-input">${escapeHtml(article.body)}</textarea>
              <p class="editor-preview-note">The editor opens in split-preview mode automatically so Markdown changes are visible instantly while you type.</p>
            </div>
          </div>
          <div class="preview-shell" data-initial-preview>${previewHtml}</div>
          <div class="editor-actions">
            <div class="editor-actions-group">
              <button type="submit" class="btn btn-primary" data-testid="save-article-button">Save Article</button>
              <a href="/admin/dashboard" class="btn btn-muted">Cancel</a>
            </div>
            ${article.sourcePath ? `
              <div class="editor-actions-group">
                <button type="submit" form="delete-article-form" class="btn btn-danger" data-testid="delete-article-button">Delete Article</button>
              </div>` : ''}
          </div>
        </form>
        ${deleteForm}
      </div>
    </div>`,
    {
      includeFontAwesome: true,
      includeEasyMDE: true,
      includeEditorScript: true,
    },
  );
}

function commentUrl(slug: string): string {
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, '');
  const encodedSlug = normalizedSlug.split('/').map((part) => encodeURIComponent(part)).join('/');
  return `/${encodedSlug}/#comments-section`;
}

function normalizeDisplaySlug(slug: string): string {
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, '');
  return `/${normalizedSlug}/`;
}

function formatAdminDateTime(value: string): string {
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const withTimezone = /([zZ]|[+-]\d\d:\d\d)$/.test(normalized) ? normalized : `${normalized}Z`;
  const date = new Date(withTimezone);

  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }

  return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
