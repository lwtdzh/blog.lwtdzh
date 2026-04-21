import { ArticleMeta } from "../lib/articles";

const adminStyle = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
  .admin-container { max-width: 1000px; margin: 0 auto; }
  .admin-header { background: #222; color: white; padding: 15px 20px; margin: -20px -20px 20px; display: flex; justify-content: space-between; align-items: center; }
  .admin-header h1 { margin: 0; font-size: 18px; }
  .admin-header a { color: #aaa; text-decoration: none; }
  .card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .info-box { background: #e8f4fd; border: 1px solid #b3d9f2; border-radius: 4px; padding: 12px 16px; margin-bottom: 20px; color: #1a5276; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; }
  th { background: #f9f9f9; font-weight: 600; }
  .btn { display: inline-block; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; font-size: 13px; }
  .btn-primary { background: #0070f3; color: white; }
  .status-hidden { color: #999; font-style: italic; }
  .status-visible { color: #0a0; }
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

export function renderDashboard(articles: ArticleMeta[]): string {
  const rows = articles.map(a => `
    <tr>
      <td><a href="/${a.slug}/" target="_blank">${escapeHtml(a.title)}</a></td>
      <td>${a.date.split('T')[0]}</td>
      <td>${a.tags.join(', ')}</td>
      <td class="${a.hidden ? 'status-hidden' : 'status-visible'}">${a.hidden ? 'Hidden' : 'Visible'}</td>
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
      <a href="/" target="_blank">View Site</a>
    </div>
  </div>
  <div class="admin-container">
    <div class="info-box">
      Articles are managed via Markdown files in <code>content/posts/</code>. To add, edit, or remove articles, commit changes to the repository and redeploy.
    </div>
    <div class="card">
      <h3>Articles (${articles.length})</h3>
      <table>
        <thead><tr><th>Title</th><th>Date</th><th>Tags</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
