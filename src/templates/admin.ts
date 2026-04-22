import { ArticleMeta } from "../lib/articles";

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

const adminStyle = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
  .admin-container { max-width: 1000px; margin: 0 auto; }
  .admin-header { background: #222; color: white; padding: 15px 20px; margin: -20px -20px 20px; display: flex; justify-content: space-between; align-items: center; }
  .admin-header h1 { margin: 0; font-size: 18px; }
  .admin-header a { color: #aaa; text-decoration: none; }
  .header-actions { display: flex; gap: 10px; align-items: center; }
  .card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .info-box { background: #e8f4fd; border: 1px solid #b3d9f2; border-radius: 4px; padding: 12px 16px; margin-bottom: 20px; color: #1a5276; font-size: 14px; }
  .notice-box { background: #eefbf0; border: 1px solid #c7e7ce; border-radius: 4px; padding: 12px 16px; margin-bottom: 20px; color: #226239; font-size: 14px; }
  .warning-box { background: #fff4e5; border: 1px solid #f0c98d; border-radius: 4px; padding: 12px 16px; margin-bottom: 20px; color: #8a5a12; font-size: 14px; }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; vertical-align: top; }
  th { background: #f9f9f9; font-weight: 600; }
  .btn { display: inline-block; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; font-size: 13px; }
  .btn-primary { background: #0070f3; color: white; }
  .btn-secondary { background: transparent; border: 1px solid rgba(255,255,255,0.18); color: white; }
  .btn-danger { background: #c0392b; color: white; }
  .status-hidden { color: #999; font-style: italic; }
  .status-visible { color: #0a0; }
  .error { color: #e00; background: #fee; padding: 10px; border-radius: 4px; margin-bottom: 10px; }
  .login-box { max-width: 400px; margin: 100px auto; }
  label { display: block; margin-bottom: 6px; font-weight: 600; }
  input[type="password"] { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #ccc; border-radius: 4px; font: inherit; }
  h3 { margin-top: 0; }
  .comment-author { font-weight: 600; margin-bottom: 4px; }
  .comment-email, .comment-meta, .comment-slug { color: #666; font-size: 12px; }
  .comment-body { margin-top: 8px; white-space: pre-wrap; word-break: break-word; line-height: 1.45; }
  .empty-state { color: #666; margin: 0; }
  .inline-form { display: inline; margin: 0; }
`;

export function renderLoginPage(error?: string, notice?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin Login</title>
  <style>${adminStyle}</style>
</head>
<body>
  <div class="login-box">
    <div class="card">
      <h2>Admin Login</h2>
      ${notice ? `<div class="notice-box">${escapeHtml(notice)}</div>` : ''}
      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
      <form method="POST" action="/admin/login">
        <label for="password">Password</label>
        <input type="password" name="password" id="password" required autofocus>
        <button type="submit" class="btn btn-primary" style="width:100%;margin-top:10px;">Login</button>
      </form>
    </div>
  </div>
</body>
</html>`;
}

export function renderDashboard(
  articles: ArticleMeta[],
  comments: AdminCommentSummary[],
  notice?: string,
  error?: string,
): string {
  const rows = articles.map(a => `
    <tr>
      <td><a href="/${a.slug}/" target="_blank">${escapeHtml(a.title)}</a></td>
      <td>${a.date.split('T')[0]}</td>
      <td>${a.tags.join(', ')}</td>
      <td class="${a.hidden ? 'status-hidden' : 'status-visible'}">${a.hidden ? 'Hidden' : 'Visible'}</td>
    </tr>`).join('');

  const commentRows = comments.map((comment) => `
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
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin Dashboard</title>
  <style>${adminStyle}</style>
</head>
<body>
  <div class="admin-header">
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
      Articles are managed via Markdown files in <code>content/posts/</code>. To add, edit, or remove articles, commit changes to the repository and redeploy.
    </div>
    <div class="card">
      <h3>Recent Comments (${comments.length})</h3>
      ${comments.length === 0 ? `<p class="empty-state">No comments yet.</p>` : `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Article</th><th>Comment</th><th>Created</th><th>Location</th><th>IP</th><th>Action</th></tr></thead>
          <tbody>${commentRows}</tbody>
        </table>
      </div>`}
    </div>
    <div class="card">
      <h3>Articles (${articles.length})</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Title</th><th>Date</th><th>Tags</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function commentUrl(slug: string): string {
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, '');
  const encodedSlug = normalizedSlug.split('/').map(part => encodeURIComponent(part)).join('/');
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
