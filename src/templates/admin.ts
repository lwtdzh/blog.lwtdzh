import { ArticleMeta } from "../lib/articles";

const adminStyle = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
  .admin-container { max-width: 1000px; margin: 0 auto; }
  .admin-header { background: #222; color: white; padding: 15px 20px; margin: -20px -20px 20px; display: flex; justify-content: space-between; align-items: center; }
  .admin-header h1 { margin: 0; font-size: 18px; }
  .admin-header a { color: #aaa; text-decoration: none; }
  .card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; }
  th { background: #f9f9f9; font-weight: 600; }
  .btn { display: inline-block; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; font-size: 13px; }
  .btn-primary { background: #0070f3; color: white; }
  .btn-danger { background: #e00; color: white; }
  .btn-warning { background: #f90; color: white; }
  .btn-sm { padding: 4px 8px; font-size: 12px; }
  .status-hidden { color: #999; font-style: italic; }
  .status-visible { color: #0a0; }
  input, textarea, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; margin-bottom: 10px; font-family: inherit; }
  textarea { min-height: 400px; font-family: monospace; font-size: 14px; }
  label { display: block; font-weight: 600; margin-bottom: 4px; margin-top: 10px; }
  .form-row { display: flex; gap: 10px; }
  .form-row > div { flex: 1; }
  .error { color: #e00; background: #fee; padding: 10px; border-radius: 4px; margin-bottom: 10px; }
  .login-box { max-width: 400px; margin: 100px auto; }
`;

export function renderLoginPage(error?: string): string {
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
      ${error ? `<div class="error">${error}</div>` : ''}
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

export function renderDashboard(articles: (ArticleMeta & { content?: string })[]): string {
  const rows = articles.map(a => `
    <tr>
      <td><a href="/admin/articles/${a.id}/edit">${a.title}</a></td>
      <td>${a.date.split('T')[0]}</td>
      <td>${a.tags.join(', ')}</td>
      <td class="${a.hidden ? 'status-hidden' : 'status-visible'}">${a.hidden ? 'Hidden' : 'Visible'}</td>
      <td>
        <form method="POST" action="/admin/articles/${a.id}/toggle-hidden" style="display:inline;">
          <button type="submit" class="btn btn-warning btn-sm">${a.hidden ? 'Show' : 'Hide'}</button>
        </form>
        <a href="/admin/articles/${a.id}/edit" class="btn btn-primary btn-sm">Edit</a>
        <form method="POST" action="/admin/articles/${a.id}/delete" style="display:inline;" onsubmit="return confirm('Delete this article?')">
          <button type="submit" class="btn btn-danger btn-sm">Delete</button>
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
    <div>
      <a href="/" target="_blank">View Site</a> |
      <a href="/admin/articles/new">+ New Article</a>
    </div>
  </div>
  <div class="admin-container">
    <div class="card">
      <h3>Articles (${articles.length})</h3>
      <table>
        <thead><tr><th>Title</th><th>Date</th><th>Tags</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
}

export function renderEditPage(article: ArticleMeta & { content: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Edit: ${article.title}</title>
  <style>${adminStyle}</style>
</head>
<body>
  <div class="admin-header">
    <h1>Edit Article</h1>
    <div><a href="/admin/dashboard">&larr; Back to Dashboard</a></div>
  </div>
  <div class="admin-container">
    <div class="card">
      <form method="POST" action="/admin/articles/${article.id}">
        <label>Title</label>
        <input type="text" name="title" value="${escapeAttr(article.title)}" required>
        <div class="form-row">
          <div>
            <label>Slug</label>
            <input type="text" name="slug" value="${escapeAttr(article.slug)}" required>
          </div>
          <div>
            <label>Date</label>
            <input type="text" name="date" value="${escapeAttr(article.date)}" required>
          </div>
        </div>
        <div class="form-row">
          <div>
            <label>Tags (JSON array)</label>
            <input type="text" name="tags" value="${escapeAttr(JSON.stringify(article.tags))}">
          </div>
          <div>
            <label>Cover URL</label>
            <input type="text" name="cover" value="${escapeAttr(article.cover)}">
          </div>
        </div>
        <label>Description</label>
        <input type="text" name="description" value="${escapeAttr(article.description)}">
        <label>Content (Markdown)</label>
        <textarea name="content">${escapeHtml(article.content)}</textarea>
        <button type="submit" class="btn btn-primary" style="margin-top:10px;">Save Changes</button>
      </form>
    </div>
  </div>
</body>
</html>`;
}

export function renderNewPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>New Article</title>
  <style>${adminStyle}</style>
</head>
<body>
  <div class="admin-header">
    <h1>New Article</h1>
    <div><a href="/admin/dashboard">&larr; Back to Dashboard</a></div>
  </div>
  <div class="admin-container">
    <div class="card">
      <form method="POST" action="/admin/articles">
        <label>Title</label>
        <input type="text" name="title" required>
        <div class="form-row">
          <div>
            <label>Slug (e.g. 2025/07/01/jpsub/my-article)</label>
            <input type="text" name="slug" required>
          </div>
          <div>
            <label>Date (ISO 8601)</label>
            <input type="text" name="date" value="${new Date().toISOString()}" required>
          </div>
        </div>
        <div class="form-row">
          <div>
            <label>Tags (JSON array)</label>
            <input type="text" name="tags" value='["中日双语字幕"]'>
          </div>
          <div>
            <label>Cover URL</label>
            <input type="text" name="cover">
          </div>
        </div>
        <label>Description</label>
        <input type="text" name="description">
        <label>Content (Markdown)</label>
        <textarea name="content"></textarea>
        <button type="submit" class="btn btn-primary" style="margin-top:10px;">Create Article</button>
      </form>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
