/**
 * Prefix a path with the configured base path.
 * Works for both API fetch URLs and asset paths in client components.
 *
 * @example
 *   apiUrl("/api/settings/proxy")
 *   // → "/scoptix/api/settings/proxy"  (when NEXT_PUBLIC_BASE_PATH="/scoptix")
 *   // → "/api/settings/proxy"          (when no base path)
 */
export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${base}${path}`;
}
