import {
  type ArticleFrontMatter,
  type ParsedArticleFile,
  parseArticleFile,
  serializeArticleFile,
} from './article-files';

const GITHUB_OWNER = 'lwtdzh';
const GITHUB_REPO = 'blog.lwtdzh';
const GITHUB_BRANCH = 'main';
const POSTS_DIRECTORY = 'content/posts';
const GITHUB_API_BASE_URL = 'https://api.github.com';

type GitHubContentFile = {
  type: string;
  name: string;
  path: string;
  sha: string;
  content?: string;
  encoding?: string;
};

type GitHubContentsResponse = GitHubContentFile | GitHubContentFile[];

type GitHubWriteResponse = {
  content?: GitHubContentFile;
};

export interface GitHubBindings {
  GITHUB_TOKEN?: string;
}

export interface GitHubArticleFile extends ParsedArticleFile {
  sourcePath: string;
  sha: string;
}

function ensureConfigured(env: GitHubBindings): string {
  const token = env.GITHUB_TOKEN?.trim();
  if (!token) {
    throw new Error('GitHub article editing is not configured. Set GITHUB_TOKEN.');
  }
  return token;
}

function isValidArticlePath(value: string): boolean {
  return /^content\/posts\/[^/]+\.md$/.test(value);
}

function assertArticlePath(value: string): string {
  if (!isValidArticlePath(value)) {
    throw new Error('Invalid article path.');
  }
  return value;
}

function decodeBase64Utf8(value: string): string {
  const cleaned = value.replace(/\n/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}

function encodeBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

async function githubRequest<T>(
  env: GitHubBindings,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = ensureConfigured(env);
  const response = await fetch(`${GITHUB_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'blog-lwtdzh-admin',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `GitHub request failed (${response.status})`;
    try {
      const payload = await response.json() as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Keep the generic message when the response is not JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function toGitHubArticleFile(file: GitHubContentFile): GitHubArticleFile {
  const content = decodeBase64Utf8(file.content || '');
  const parsed = parseArticleFile(content);

  return {
    ...parsed,
    sourcePath: file.path,
    sha: file.sha,
  };
}

export function isGitHubConfigured(env: GitHubBindings): boolean {
  return Boolean(env.GITHUB_TOKEN?.trim());
}

export async function listGitHubArticleFiles(env: GitHubBindings): Promise<GitHubArticleFile[]> {
  const contents = await githubRequest<GitHubContentsResponse>(
    env,
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${POSTS_DIRECTORY}?ref=${GITHUB_BRANCH}`,
  );

  if (!Array.isArray(contents)) {
    throw new Error('Unexpected GitHub contents response.');
  }

  const files = contents.filter(
    (entry) => entry.type === 'file' && entry.path.endsWith('.md') && isValidArticlePath(entry.path),
  );

  const parsedFiles = await Promise.all(
    files.map((entry) => getGitHubArticleFile(env, entry.path)),
  );

  return parsedFiles.sort((left, right) => right.data.date.localeCompare(left.data.date));
}

export async function getGitHubArticleFile(
  env: GitHubBindings,
  sourcePath: string,
): Promise<GitHubArticleFile> {
  const path = assertArticlePath(sourcePath);
  const file = await githubRequest<GitHubContentFile>(
    env,
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`,
  );

  if (!file || file.type !== 'file') {
    throw new Error('Article not found.');
  }

  return toGitHubArticleFile(file);
}

export async function createGitHubArticleFile(
  env: GitHubBindings,
  sourcePath: string,
  article: ParsedArticleFile,
  title: string,
): Promise<GitHubArticleFile> {
  const path = assertArticlePath(sourcePath);
  const serializedContent = encodeBase64Utf8(serializeArticleFile(article));

  const response = await githubRequest<GitHubWriteResponse>(
    env,
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        message: `admin: add article "${title}"`,
        content: serializedContent,
        branch: GITHUB_BRANCH,
      }),
    },
  );

  const created = response.content;
  if (!created) {
    throw new Error('GitHub did not return the created file.');
  }

  return getGitHubArticleFile(env, created.path);
}

export async function updateGitHubArticleFile(
  env: GitHubBindings,
  sourcePath: string,
  article: ParsedArticleFile,
  title: string,
  sha: string,
): Promise<GitHubArticleFile> {
  const path = assertArticlePath(sourcePath);
  const serializedContent = encodeBase64Utf8(serializeArticleFile(article));

  const response = await githubRequest<GitHubWriteResponse>(
    env,
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        message: `admin: update article "${title}"`,
        content: serializedContent,
        sha,
        branch: GITHUB_BRANCH,
      }),
    },
  );

  const updated = response.content;
  if (!updated) {
    throw new Error('GitHub did not return the updated file.');
  }

  return getGitHubArticleFile(env, updated.path);
}

export async function deleteGitHubArticleFile(
  env: GitHubBindings,
  sourcePath: string,
  title: string,
  sha: string,
): Promise<void> {
  const path = assertArticlePath(sourcePath);
  await githubRequest(
    env,
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'DELETE',
      body: JSON.stringify({
        message: `admin: delete article "${title}"`,
        sha,
        branch: GITHUB_BRANCH,
      }),
    },
  );
}

export function toArticleMetaFromGitHub(
  file: GitHubArticleFile,
  index: number,
): ArticleFrontMatter & { sourcePath: string; id: number } {
  return {
    ...file.data,
    sourcePath: file.sourcePath,
    id: index,
  };
}
