import { marked } from 'marked';

// Configure marked for our blog
marked.setOptions({
  gfm: true,
  breaks: false,
});

// Custom renderer
const renderer = new marked.Renderer();

// External links open in new tab
// marked v12 uses positional args: (href, title, text)
renderer.link = function (href: string, title: string | null, text: string) {
  const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
  const titleAttr = title ? ` title="${title}"` : '';
  if (isExternal) {
    return `<a target="_blank" rel="noopener" href="${href}"${titleAttr}>${text}</a>`;
  }
  return `<a href="${href}"${titleAttr}>${text}</a>`;
};

// Images with lazy loading
// marked v12 uses positional args: (href, title, text)
renderer.image = function (href: string, title: string | null, text: string) {
  const titleAttr = title ? ` title="${title}"` : '';
  const altAttr = text ? ` alt="${text}"` : '';
  return `<img src="${href}"${altAttr}${titleAttr} loading="lazy">`;
};

marked.use({ renderer });

export function renderMarkdown(content: string): string {
  return marked.parse(content) as string;
}

export function getExcerpt(content: string): string {
  // Split at <!-- more --> marker
  const parts = content.split('<!-- more -->');
  if (parts.length > 1) {
    return renderMarkdown(parts[0].trim());
  }
  // If no marker, use first paragraph
  const firstPara = content.split('\n\n')[0];
  return renderMarkdown(firstPara.trim());
}
