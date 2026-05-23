export function buildPublicUploadsUrl(
  filePath: string | null | undefined,
): string | null {
  if (!filePath) return null;

  const normalizedPath = String(filePath).replace(/^\/+/, '');
  const relativeUploadsUrl = `/uploads/${normalizedPath}`;

  const configuredApiUrl = process.env.API_URL?.trim();
  if (!configuredApiUrl) {
    return relativeUploadsUrl;
  }

  const isProduction =
    (process.env.NODE_ENV ?? '').toLowerCase() === 'production';
  const isLocalApiUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(
    configuredApiUrl,
  );

  // Production safety: never expose localhost URLs to browser clients.
  if (isProduction && isLocalApiUrl) {
    return relativeUploadsUrl;
  }

  try {
    return new URL(relativeUploadsUrl, configuredApiUrl).toString();
  } catch {
    return relativeUploadsUrl;
  }
}
