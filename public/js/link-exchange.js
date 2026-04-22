// Link exchange dynamic loader
(function() {
  'use strict';

  // Parse link line: "Description https://example.com"
  function parseLinkLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // Find the last URL in the line
    const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)$/);
    if (!urlMatch) return null;

    const url = urlMatch[1];
    const description = trimmed.substring(0, trimmed.lastIndexOf(url)).trim();

    return {
      description: description || url,
      url: url
    };
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Render link card
  function renderLinkCard(link) {
    return `
      <a class="link-exchange-card" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
        <div class="link-exchange-description">${escapeHtml(link.description)}</div>
        <div class="link-exchange-url">${escapeHtml(link.url)}</div>
      </a>
    `;
  }

  // Load and render links
  async function loadLinks() {
    const container = document.getElementById('link-exchange');
    if (!container) return;
    const content = container.querySelector('.link-exchange-content') || container;

    try {
      const response = await fetch('https://raw.githubusercontent.com/lwtdzh/link-exchange/refs/heads/main/links');
      if (!response.ok) throw new Error('Failed to fetch links');

      const text = await response.text();
      const lines = text.split('\n');
      
      const links = [];
      lines.forEach(function(line) {
        const parsed = parseLinkLine(line);
        if (parsed) links.push(parsed);
      });

      if (links.length === 0) {
        content.innerHTML = '<p class="link-exchange-empty">No links available.</p>';
        return;
      }

      content.innerHTML = '<div class="link-exchange-grid">' + 
        links.map(renderLinkCard).join('') + 
        '</div>';
    } catch (error) {
      console.error('Error loading links:', error);
      content.innerHTML = '<p class="link-exchange-error">Failed to load links. Please try again later.</p>';
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadLinks);
  } else {
    loadLinks();
  }
})();
