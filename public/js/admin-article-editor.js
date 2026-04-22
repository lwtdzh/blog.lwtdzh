/* global EasyMDE */
(function() {
  'use strict';

  function normalizeSlug(value) {
    return String(value || '').trim().replace(/^\/+|\/+$/g, '');
  }

  function normalizeTags(value) {
    return String(value || '')
      .split(',')
      .map(function(tag) { return tag.trim(); })
      .filter(Boolean)
      .join(', ');
  }

  function initializeEditor() {
    var textarea = document.getElementById('article-body');
    if (!textarea || typeof EasyMDE === 'undefined') {
      return;
    }

    var editor = new EasyMDE({
      element: textarea,
      autofocus: false,
      autoDownloadFontAwesome: false,
      forceSync: true,
      spellChecker: false,
      status: ['lines', 'words', 'cursor'],
      sideBySideFullscreen: false,
      minHeight: '420px',
      renderingConfig: {
        singleLineBreaks: false,
        codeSyntaxHighlighting: false
      }
    });

    window.__adminEasyMDE = editor;
    editor.toggleSideBySide();
  }

  function initializeFormNormalization() {
    var form = document.querySelector('[data-testid="article-editor-form"]');
    if (!form) {
      return;
    }

    form.addEventListener('submit', function() {
      var slugInput = document.getElementById('article-slug');
      var tagsInput = document.getElementById('article-tags');

      if (slugInput) {
        slugInput.value = normalizeSlug(slugInput.value);
      }

      if (tagsInput) {
        tagsInput.value = normalizeTags(tagsInput.value);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initializeEditor();
      initializeFormNormalization();
    });
  } else {
    initializeEditor();
    initializeFormNormalization();
  }
})();
