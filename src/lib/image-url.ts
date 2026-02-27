/**
 * Rewrites stored image URLs for display. R2 API endpoint (cloudflarestorage.com)
 * requires auth and breaks <img>; rewrite to our proxy URL so images load.
 */
export function toDisplayUrl(
  storedUrl: string | null | undefined
): string | null | undefined {
  if (!storedUrl?.trim()) return storedUrl;
  try {
    const u = new URL(storedUrl.trim());
    if (!/\.r2\.cloudflarestorage\.com$/i.test(u.hostname)) return storedUrl;
    const pathname = u.pathname.replace(/^\/+/, "");
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length < 2) return storedUrl;
    const key = segments.slice(1).join("/");
    return `/api/files/${key}`;
  } catch {
    return storedUrl;
  }
}
