// Client-side visitor counter
(function() {
  'use strict';

  // Format number with commas
  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Handle post page visitor count
  async function handlePostPage() {
    if (!CONFIG || !CONFIG.page || !CONFIG.page.isPost) return;

    const slug = window.location.pathname;
    if (!slug) return;

    try {
      // Increment visitor count
      await fetch('/api/visitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ slug: slug })
      });

      // Fetch updated count
      const response = await fetch('/api/visitors?slugs=' + encodeURIComponent(slug));
      if (!response.ok) throw new Error('Failed to fetch visitor count');
      
      const data = await response.json();
      const count = data[slug] || 0;

      // Update display
      const countElement = document.querySelector('.visitor-count');
      if (countElement) {
        countElement.textContent = formatNumber(count);
      }
    } catch (error) {
      console.error('Error updating visitor count:', error);
    }
  }

  // Handle home/list page visitor counts
  async function handleListPage() {
    if (!CONFIG || !CONFIG.page || (!CONFIG.page.isHome && !document.querySelectorAll('.leancloud_visitors').length > 1)) return;

    const visitorElements = document.querySelectorAll('.leancloud_visitors');
    if (visitorElements.length === 0) return;

    // Collect all slugs
    const slugs = [];
    visitorElements.forEach(function(element) {
      const slug = element.getAttribute('id');
      if (slug) slugs.push(slug);
    });

    if (slugs.length === 0) return;

    try {
      // Batch fetch visitor counts
      const response = await fetch('/api/visitors?slugs=' + encodeURIComponent(slugs.join(',')));
      if (!response.ok) throw new Error('Failed to fetch visitor counts');
      
      const data = await response.json();

      // Update each element
      visitorElements.forEach(function(element) {
        const slug = element.getAttribute('id');
        const countElement = element.querySelector('.leancloud-visitors-count');
        if (countElement && data[slug] !== undefined) {
          countElement.textContent = formatNumber(data[slug]);
        }
      });
    } catch (error) {
      console.error('Error fetching visitor counts:', error);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      handlePostPage();
      handleListPage();
    });
  } else {
    handlePostPage();
    handleListPage();
  }
})();
