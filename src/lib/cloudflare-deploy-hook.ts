export interface CloudflareDeployHookBindings {
  CLOUDFLARE_DEPLOY_HOOK?: string;
}

function getDeployHookUrl(env: CloudflareDeployHookBindings): string | null {
  const value = env.CLOUDFLARE_DEPLOY_HOOK?.trim();
  if (!value) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Cloudflare deploy hook URL is invalid.');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Cloudflare deploy hook URL must use HTTPS.');
  }

  return parsed.toString();
}

export function isDeployHookConfigured(env: CloudflareDeployHookBindings): boolean {
  return Boolean(env.CLOUDFLARE_DEPLOY_HOOK?.trim());
}

export async function triggerDeployHook(
  env: CloudflareDeployHookBindings,
): Promise<void> {
  const url = getDeployHookUrl(env);
  if (!url) {
    throw new Error('Cloudflare deploy hook is not configured.');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'blog-lwtdzh-admin',
    },
    body: '{}',
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      text
        ? `Cloudflare deploy hook failed (${response.status}): ${text}`
        : `Cloudflare deploy hook failed (${response.status}).`,
    );
  }
}
