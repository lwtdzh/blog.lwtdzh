export interface ArticleFrontMatter {
  title: string;
  date: string;
  updated?: string;
  slug: string;
  tags: string[];
  description?: string;
  cover?: string;
  hidden?: boolean;
}

export interface ParsedArticleFile {
  data: ArticleFrontMatter;
  content: string;
}

const SHANGHAI_OFFSET = '+08:00';

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function formatDateParts(date: Date): {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
} {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return {
    year: values.get('year') || '1970',
    month: values.get('month') || '01',
    day: values.get('day') || '01',
    hour: values.get('hour') || '00',
    minute: values.get('minute') || '00',
    second: values.get('second') || '00',
  };
}

export function formatArticleTimestamp(date: Date = new Date()): string {
  const parts = formatDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${SHANGHAI_OFFSET}`;
}

export function toDatetimeLocalValue(value: string | undefined): string {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.replace(/([zZ]|[+-]\d\d:\d\d)$/, '');
  }

  const parts = formatDateParts(parsed);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

export function parseDatetimeLocalValue(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second = '00'] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${SHANGHAI_OFFSET}`;
}

export function normalizeArticleSlug(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, '');
}

export function normalizeArticleTags(value: string | string[]): string[] {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    );
  }

  return Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

export function slugTailToFilenameBase(slug: string): string {
  const normalizedSlug = normalizeArticleSlug(slug);
  const tail = normalizedSlug.split('/').filter(Boolean).pop() || 'article';
  const sanitized = tail
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return sanitized || 'article';
}

export function chooseArticleFilePath(slug: string, existingPaths: string[]): string {
  const existing = new Set(existingPaths);
  const baseName = slugTailToFilenameBase(slug);
  let candidate = `content/posts/${baseName}.md`;
  let suffix = 2;

  while (existing.has(candidate)) {
    candidate = `content/posts/${baseName}-${suffix}.md`;
    suffix += 1;
  }

  return candidate;
}

export function parseArticleFile(fileContent: string): ParsedArticleFile {
  const match = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error('No front matter found');
  }

  const yamlStr = match[1];
  const content = match[2].trim();
  const data: Partial<ArticleFrontMatter> = {};
  const lines = yamlStr.split('\n');

  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      continue;
    }

    const key = line.substring(0, colonIdx).trim();
    const rawValue = line.substring(colonIdx + 1).trim();
    const value = unquote(rawValue);

    if (key === 'tags') {
      try {
        data.tags = JSON.parse(value);
      } catch {
        data.tags = [];
      }
      continue;
    }

    if (key === 'hidden') {
      data.hidden = value === 'true';
      continue;
    }

    (data as Record<string, string>)[key] = value;
  }

  return {
    data: {
      title: data.title || '',
      date: data.date || '',
      updated: data.updated || data.date || '',
      slug: data.slug || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      description: data.description || '',
      cover: data.cover || '',
      hidden: Boolean(data.hidden),
    },
    content,
  };
}

export function serializeArticleFile(article: ParsedArticleFile): string {
  const data = article.data;
  const lines = [
    '---',
    `title: ${JSON.stringify(data.title || '')}`,
    `date: ${JSON.stringify(data.date || '')}`,
    `updated: ${JSON.stringify(data.updated || data.date || '')}`,
    `slug: ${JSON.stringify(normalizeArticleSlug(data.slug || ''))}`,
    `tags: ${JSON.stringify(normalizeArticleTags(data.tags || []))}`,
    `description: ${JSON.stringify(data.description || '')}`,
    `cover: ${JSON.stringify(data.cover || '')}`,
    `hidden: ${data.hidden ? 'true' : 'false'}`,
    '---',
    '',
    article.content.trim(),
    '',
  ];

  return lines.join('\n');
}
