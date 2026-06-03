/** Host-only domain for Google favicon lookup (no path, no scheme). */
export function normalizeFaviconDomain(domain: string): string {
  const trimmed = domain.trim();
  if (!trimmed) return "";
  const withoutScheme = trimmed.replace(/^https?:\/\//i, "");
  return withoutScheme.split("/")[0]?.split(":")[0] ?? withoutScheme;
}

export function googleFaviconUrl(domain: string, sz = 32): string {
  const host = normalizeFaviconDomain(domain);
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${sz}`;
}
