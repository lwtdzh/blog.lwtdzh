// Client-side comment system
(function() {
  'use strict';

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffYear > 0) return diffYear + ' year' + (diffYear > 1 ? 's' : '') + ' ago';
    if (diffMonth > 0) return diffMonth + ' month' + (diffMonth > 1 ? 's' : '') + ' ago';
    if (diffDay > 0) return diffDay + ' day' + (diffDay > 1 ? 's' : '') + ' ago';
    if (diffHour > 0) return diffHour + ' hour' + (diffHour > 1 ? 's' : '') + ' ago';
    if (diffMin > 0) return diffMin + ' minute' + (diffMin > 1 ? 's' : '') + ' ago';
    return 'just now';
  }

  function hashString(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash) + value.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function getAvatarUrl(seed) {
    const safeSeed = (seed || 'Visitor').trim();
    const initial = safeSeed.charAt(0).toUpperCase() || 'V';
    const palette = ['#4a90d9', '#2f7b9f', '#3f8f7a', '#9c6b3f', '#8a4f9c'];
    const color = palette[hashString(safeSeed) % palette.length];
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">',
      '<rect width="96" height="96" rx="48" fill="' + color + '"/>',
      '<text x="48" y="58" text-anchor="middle" font-size="40" font-family="Arial, sans-serif" fill="#ffffff">',
      escapeHtml(initial),
      '</text>',
      '</svg>',
    ].join('');

    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  async function fetchJson(url, options) {
    const response = await fetch(url, options);
    const text = await response.text();
    let payload = null;

    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text;
    }

    if (!response.ok) {
      const message = payload && typeof payload === 'object' && payload.error
        ? payload.error
        : 'Request failed';
      throw new Error(message);
    }

    return payload;
  }

  function updateCommentCountElements(counts) {
    const countElements = document.querySelectorAll('.post-comments-count[data-xid]');
    countElements.forEach(function(element) {
      const slug = element.getAttribute('data-xid');
      if (slug && counts[slug] !== undefined) {
        element.textContent = String(counts[slug]);
      }
    });
  }

  function renderComment(comment) {
    const author = comment.author || 'Visitor';
    const locationHtml = comment.location
      ? '<span class="comment-location">' + escapeHtml(comment.location) + '</span>'
      : '';
    const avatarUrl = getAvatarUrl(author + ':' + (comment.location || ''));

    return [
      '<div class="comment-item">',
      '  <img class="comment-avatar" src="' + avatarUrl + '" alt="Visitor avatar">',
      '  <div class="comment-body">',
      '    <div class="comment-meta">',
      '      <strong class="comment-author">' + escapeHtml(author) + '</strong>',
      locationHtml,
      '      <span class="comment-time">' + escapeHtml(formatRelativeTime(comment.created_at)) + '</span>',
      '    </div>',
      '    <div class="comment-content">' + escapeHtml(comment.content) + '</div>',
      '  </div>',
      '</div>',
    ].join('');
  }

  async function loadCommentCounts() {
    const countElements = document.querySelectorAll('.post-comments-count[data-xid]');
    if (!countElements.length) {
      return;
    }

    const slugs = Array.from(new Set(Array.from(countElements)
      .map(function(element) { return element.getAttribute('data-xid') || ''; })
      .filter(Boolean)));

    if (!slugs.length) {
      return;
    }

    try {
      const counts = await fetchJson('/api/comments?slugs=' + encodeURIComponent(slugs.join(',')));
      if (counts && typeof counts === 'object') {
        updateCommentCountElements(counts);
      }
    } catch (error) {
      console.error('Error loading comment counts:', error);
    }
  }

  async function loadComments() {
    const container = document.getElementById('comments-section');
    if (!container) {
      return;
    }

    const slug = window.location.pathname;
    if (!slug) {
      return;
    }

    const listContainer = container.querySelector('.comment-list');
    if (!listContainer) {
      return;
    }

    try {
      const comments = await fetchJson('/api/comments?slug=' + encodeURIComponent(slug));
      updateCommentCountElements({ [slug]: comments.length });

      if (!comments.length) {
        listContainer.innerHTML = '<p class="comment-empty">No comments yet. Be the first to comment!</p>';
        return;
      }

      listContainer.innerHTML = comments.map(renderComment).join('');
    } catch (error) {
      console.error('Error loading comments:', error);
      listContainer.innerHTML = '<p class="comment-error">Failed to load comments. Please try again later.</p>';
    }
  }

  function setupCommentForm() {
    const form = document.querySelector('.comment-form');
    if (!form) {
      return;
    }

    const contentInput = form.querySelector('.comment-textarea');
    const submitButton = form.querySelector('.comment-submit');

    if (!contentInput || !submitButton) {
      return;
    }

    form.addEventListener('submit', async function(event) {
      event.preventDefault();

      const content = contentInput.value.trim();
      if (!content) {
        alert('Comment content is required.');
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';

      try {
        await fetchJson('/api/comments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            slug: window.location.pathname,
            content: content
          })
        });

        contentInput.value = '';
        await loadComments();
      } catch (error) {
        console.error('Error submitting comment:', error);
        alert('Failed to submit comment. Please try again.');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
      }
    });
  }

  async function initializeComments() {
    await loadCommentCounts();
    await loadComments();
    setupCommentForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initializeComments();
    });
  } else {
    initializeComments();
  }
})();
