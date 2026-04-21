const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', '.idea', 'scripts', 'functions'].includes(file)) {
        findHtmlFiles(filePath, fileList);
      }
    } else if (file === 'index.html') {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function isPostPage(content) {
  return /isPost\s*:\s*true/.test(content);
}

function processHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  const isPost = isPostPage(content);
  const relPath = path.relative(PROJECT_ROOT, filePath);

  console.log(`Processing: ${relPath} (isPost: ${isPost})`);

  // 1. Remove Valine script block (matches the entire script tag containing NexT.utils.loadComments and Valine)
  content = content.replace(/<script>\nNexT\.utils\.loadComments[\s\S]*?<\/script>/g, '');

  // 2. Remove valine-comments container div (handles both id-only and class+id patterns)
  content = content.replace(/<div[^>]*id="valine-comments"[^>]*>\s*<\/div>/g, '');
  
  // Also remove the comments tab script block
  content = content.replace(/<script>\s*\n\s*window\.addEventListener\('tabs:register'[\s\S]*?<\/script>/g, '');

  // 3. Replace "Valine: " text with "Comments: "
  content = content.replace(/Valine:\s/g, 'Comments: ');

  // 4. Replace valine-comments href anchors
  content = content.replace(/#valine-comments/g, '#comments-section');

  // 5. For post pages, add comment section container before </main> closing
  if (isPost) {
    // Add comments section after the last </article> in the content area
    const commentHtml = `
<div class="comments" id="comments-section">
  <h3 class="comment-title"><i class="far fa-comment"></i> Comments</h3>
  <div class="comment-list"></div>
  <form class="comment-form">
    <div class="comment-form-fields">
      <input class="comment-input" name="nickname" type="text" placeholder="Nickname *" required>
      <input class="comment-input" name="email" type="email" placeholder="Email (optional)">
    </div>
    <textarea class="comment-textarea" name="content" placeholder="Write your comment here..." required></textarea>
    <button class="comment-submit" type="submit">Submit Comment</button>
  </form>
</div>`;

    // Insert before the sidebar section (after content-wrap closes)
    if (content.includes('</article>')) {
      const lastArticleEnd = content.lastIndexOf('</article>');
      const afterArticle = content.indexOf('\n', lastArticleEnd);
      content = content.substring(0, afterArticle + 1) + commentHtml + content.substring(afterArticle + 1);
      console.log('  + Added comment section');
    }
  }

  // 6. Add link exchange container in footer-inner
  const linkExchangeHtml = `
    <div id="link-exchange">
      <h3 class="link-exchange-title"><i class="fa fa-link"></i> Friend Links</h3>
    </div>`;

  // Find the closing </div> of footer-inner (before </footer>)
  const footerMatch = content.match(/<footer class="footer">\s*<div class="footer-inner">/);
  if (footerMatch) {
    // Find the position right before the closing </div> of footer-inner
    const footerInnerStart = footerMatch.index + footerMatch[0].length;
    // Find the </div>\n    </footer> pattern
    const footerClosePattern = /\n\s*<\/div>\s*\n\s*<\/footer>/;
    const footerCloseMatch = content.substring(footerInnerStart).match(footerClosePattern);
    if (footerCloseMatch) {
      const insertPos = footerInnerStart + footerCloseMatch.index;
      content = content.substring(0, insertPos) + '\n' + linkExchangeHtml + content.substring(insertPos);
      console.log('  + Added link exchange section');
    }
  }

  // 7. Add new JS references before </body>
  const newScripts = `
<script src="/js/visitors.js"></script>
<script src="/js/comments.js"></script>
<script src="/js/link-exchange.js"></script>

`;
  content = content.replace('</body>', newScripts + '</body>');

  // Write file if changed
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('  ✓ Updated');
  } else {
    console.log('  - No changes');
  }
}

// Main
console.log('=== Batch HTML Update Script ===\n');
const htmlFiles = findHtmlFiles(PROJECT_ROOT);
console.log(`Found ${htmlFiles.length} HTML files\n`);

htmlFiles.forEach(filePath => {
  try {
    processHtmlFile(filePath);
  } catch (err) {
    console.error(`  ✗ Error: ${err.message}`);
  }
});

console.log('\n=== Done ===');
