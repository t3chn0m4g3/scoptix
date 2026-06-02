import { ScanJobStatus, type PrismaClient } from "@prisma/client";
import { resolveFindingRankVisual } from "@/lib/summary-rank-style";
import type { SummarySourceSlice } from "@/lib/scan-summary";

export type DashboardTargetFindingRow = {
  domain: string;
  targetId: string;
  count: number;
  barWidthPercent: number;
};

export type DashboardLastScanSummary = {
  scanId: string;
  domain: string;
  status: ScanJobStatus;
  scannedAt: string;
  duration: string;
  scanIdShort: string;
  findings: number;
  urls: number;
  subdomains: number;
  href: string;
};

export type DashboardFindingTypeRow = {
  label: string;
  count: number;
  percent: number;
  color: string;
};

export type DashboardInsightsData = {
  topTargetsByFindings: DashboardTargetFindingRow[];
  lastScan: DashboardLastScanSummary | null;
  findingTypes: DashboardFindingTypeRow[];
  findingTypeSlices: SummarySourceSlice[];
  findingsTotal: number;
};

const DONUT_SLICE_CAP = 8;

const FALLBACK_SLICE_COLORS = [
  "#ef4444",
  "#f97316",
  "#22c55e",
  "#a855f7",
  "#3b82f6",
  "#14b8a6",
  "#f59e0b",
  "#6366f1",
];

function barWidth(count: number, max: number) {
  if (max <= 0 || count <= 0) return 0;
  return Math.round((count / max) * 100);
}

function formatDuration(
  startedAt: Date | null | undefined,
  completedAt: Date | null | undefined,
) {
  if (!startedAt || !completedAt) return "—";
  const ms = completedAt.getTime() - startedAt.getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatScannedAt(completedAt: Date | null, createdAt: Date) {
  const d = completedAt ?? createdAt;
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function resolveScanCounts(
  prisma: PrismaClient,
  scan: {
    id: string;
    observedFindingCount: number | null;
    observedSubdomainCount: number | null;
    observedUrlCount: number | null;
  },
) {
  const observedSubdomainModel = (
    prisma as PrismaClient & {
      scanObservedSubdomain: { count: (args: { where: { scanJobId: string } }) => Promise<number> };
      scanObservedUrl: { count: (args: { where: { scanJobId: string } }) => Promise<number> };
    }
  ).scanObservedSubdomain;
  const observedUrlModel = (
    prisma as PrismaClient & {
      scanObservedUrl: { count: (args: { where: { scanJobId: string } }) => Promise<number> };
    }
  ).scanObservedUrl;

  const [findings, subdomains, urls] = await Promise.all([
    scan.observedFindingCount ??
      prisma.analysisFinding.count({ where: { scanJobId: scan.id } }),
    scan.observedSubdomainCount ??
      observedSubdomainModel.count({ where: { scanJobId: scan.id } }),
    scan.observedUrlCount ?? observedUrlModel.count({ where: { scanJobId: scan.id } }),
  ]);

  return { findings, subdomains, urls };
}

function buildDonutSlices(
  rows: DashboardFindingTypeRow[],
  total: number,
): SummarySourceSlice[] {
  if (total <= 0) return [];

  const sorted = [...rows].sort((a, b) => b.count - a.count);
  const head = sorted.slice(0, DONUT_SLICE_CAP);
  const tail = sorted.slice(DONUT_SLICE_CAP);
  const tailCount = tail.reduce((sum, row) => sum + row.count, 0);

  const slices: SummarySourceSlice[] = head.map((row, index) => ({
    label: row.label,
    count: row.count,
    percent: Math.round((row.count / total) * 100),
    color: row.color || FALLBACK_SLICE_COLORS[index % FALLBACK_SLICE_COLORS.length],
  }));

  if (tailCount > 0) {
    slices.push({
      label: "Others",
      count: tailCount,
      percent: Math.round((tailCount / total) * 100),
      color: FALLBACK_SLICE_COLORS[slices.length % FALLBACK_SLICE_COLORS.length],
    });
  }

  const percentSum = slices.reduce((s, slice) => s + slice.percent, 0);
  if (percentSum !== 100 && slices.length > 0) {
    slices[0] = { ...slices[0], percent: slices[0].percent + (100 - percentSum) };
  }

  return slices;
}

export async function loadDashboardInsights(prisma: PrismaClient): Promise<DashboardInsightsData> {
  const [topTargets, lastCompletedScan, latestAnyScan, findingGroups] = await Promise.all([
    prisma.targetDomain.findMany({
      orderBy: [{ cachedFindingCount: "desc" }, { domainNormalized: "asc" }],
      take: 6,
      select: {
        id: true,
        domainNormalized: true,
        cachedFindingCount: true,
      },
    }),
    prisma.scanJob.findFirst({
      where: { status: ScanJobStatus.COMPLETED },
      orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
      include: { targetDomain: { select: { domainNormalized: true } } },
    }),
    prisma.scanJob.findFirst({
      orderBy: { createdAt: "desc" },
      include: { targetDomain: { select: { domainNormalized: true } } },
    }),
    prisma.analysisFinding.groupBy({
      by: ["findingType"],
      _count: { _all: true },
      orderBy: { _count: { findingType: "desc" } },
    }),
  ]);

  const maxFindings = topTargets[0]?.cachedFindingCount ?? 0;
  const topTargetsByFindings: DashboardTargetFindingRow[] = topTargets.map((t) => ({
    domain: t.domainNormalized,
    targetId: t.id,
    count: t.cachedFindingCount,
    barWidthPercent: barWidth(t.cachedFindingCount, maxFindings),
  }));

  const scan = lastCompletedScan ?? latestAnyScan;
  let lastScan: DashboardLastScanSummary | null = null;

  if (scan) {
    const counts = await resolveScanCounts(prisma, scan);
    const isCompleted = scan.status === ScanJobStatus.COMPLETED;
    lastScan = {
      scanId: scan.id,
      domain: scan.targetDomain.domainNormalized,
      status: scan.status,
      scannedAt: formatScannedAt(scan.completedAt, scan.createdAt),
      duration: formatDuration(scan.startedAt, scan.completedAt),
      scanIdShort: scan.id.slice(0, 8),
      findings: counts.findings,
      urls: counts.urls,
      subdomains: counts.subdomains,
      href: isCompleted ? `/scans/${scan.id}/observed` : `/scans/${scan.id}`,
    };
  }

  const findingsTotal = findingGroups.reduce((sum, g) => sum + g._count._all, 0);
  const findingTypes: DashboardFindingTypeRow[] = findingGroups.map((g, index) => {
    const visual = resolveFindingRankVisual(g.findingType, index);
    const color =
      visual.iconStroke ??
      FALLBACK_SLICE_COLORS[index % FALLBACK_SLICE_COLORS.length];
    return {
      label: g.findingType,
      count: g._count._all,
      percent: findingsTotal > 0 ? Math.round((g._count._all / findingsTotal) * 100) : 0,
      color,
    };
  });

  const percentSum = findingTypes.reduce((s, row) => s + row.percent, 0);
  if (findingsTotal > 0 && percentSum !== 100 && findingTypes.length > 0) {
    findingTypes[0] = {
      ...findingTypes[0],
      percent: findingTypes[0].percent + (100 - percentSum),
    };
  }

  return {
    topTargetsByFindings,
    lastScan,
    findingTypes,
    findingTypeSlices: buildDonutSlices(findingTypes, findingsTotal),
    findingsTotal,
  };
}
