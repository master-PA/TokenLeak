/**
 * Site URLs for metadata (Open Graph) and outbound CTAs.
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://yourapp.vercel.app).
 */
export function getPublicAppOrigin(): URL | null {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : null);
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

/** Credex consultation / contact — configure in dashboard; falls back to credex.rocks. */
export function getCredexBookUrl(): string {
  const url = process.env.NEXT_PUBLIC_CREDEX_BOOK_URL?.trim();
  if (url) return url;
  return "https://credex.rocks";
}
