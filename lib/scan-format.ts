/** ISO-like UTC timestamp for IP directory tables (e.g. 2024-06-16 10:50:21). */
export function formatIpTableDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

/** Panel / mockup style: `10 May 2026, 11:39 AM` (UTC). */
export function formatPassiveDnsPanelDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

/** VirusTotal passive DNS style: `16 Jun 2024, 10:50:21` (UTC). */
export function formatVtPassiveDnsDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  const day = d.getUTCDate();
  const month = d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  const year = d.getUTCFullYear();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${day} ${month} ${year}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

export function formatObservedHostnameCount(count: number) {
  const n = Math.max(0, Math.floor(count));
  return n === 1 ? "1 hostname" : `${n.toLocaleString()} hostnames`;
}

export function vtPassiveDnsIpBanner(hostnameCount: number) {
  if (hostnameCount <= 1) {
    return "This IP has been observed resolving to a single hostname in VirusTotal passive DNS data.";
  }
  return "This IP has been observed resolving to multiple hostnames in VirusTotal passive DNS data.";
}

export function formatHostnameCountLabel(count: number) {
  const n = Math.max(0, Math.floor(count));
  return n === 1 ? "1 subdomain" : `${n.toLocaleString()} subdomains`;
}

export function formatScanDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatScanDuration(
  startedAt: Date | string | null | undefined,
  completedAt: Date | string | null | undefined,
) {
  if (!startedAt || !completedAt) return "—";
  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  const end = typeof completedAt === "string" ? new Date(completedAt) : completedAt;
  const ms = end.getTime() - start.getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function shortScanId(id: string, len = 8) {
  return id.length > len ? id.slice(0, len) : id;
}
