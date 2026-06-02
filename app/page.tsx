import Link from "next/link";
import { ScanJobStatus } from "@prisma/client";
import {
  DashboardApiKeyUsageChart,
  DashboardFailedScanAlert,
  DashboardFindingsActivityChart,
  DashboardScanActivityChart,
  DashboardScanStatusChart,
} from "@/components/dashboard-charts";
import { DashboardGreeting } from "@/components/dashboard-greeting";
import { DashboardPeriodMenu } from "@/components/dashboard-period-menu";
import { DashboardInsightsRow } from "@/components/dashboard/dashboard-insights-row";
import { DashboardStatCards } from "@/components/dashboard-stat-cards";
import { loadDashboardInsights } from "@/lib/dashboard-insights";
import { TopBar } from "@/components/top-bar";
import {
  dashboardChartRangeParams,
  loadDashboardCharts,
  parseActivityRange,
} from "@/lib/dashboard-stats";
import {
  DEFAULT_DASHBOARD_PERIOD,
  dashboardPeriodSiblingParams,
  loadDashboardOverview,
  parseDashboardPeriod,
} from "@/lib/dashboard-overview";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: "bg-accent/15 text-accent",
  RUNNING: "bg-accent/25 text-cream",
  QUEUED: "bg-muted/15 text-muted",
  FAILED: "bg-warn/15 text-warn",
  CANCELLED: "bg-muted/10 text-muted",
  PAUSED: "bg-warn/10 text-warn",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    scanRange?: string;
    findingsRange?: string;
    range?: string;
    period?: string;
  }>;
}) {
  const params = await searchParams;
  const scanRange = parseActivityRange(params.scanRange ?? params.range);
  const findingsRange = parseActivityRange(params.findingsRange ?? params.range);
  const periodKey = parseDashboardPeriod(params.period);
  const rangeParams: Record<string, string> = {
    ...dashboardChartRangeParams(scanRange, findingsRange),
  };
  if (periodKey !== DEFAULT_DASHBOARD_PERIOD) rangeParams.period = periodKey;

  const periodSiblingParams = dashboardPeriodSiblingParams(
    rangeParams.scanRange,
    rangeParams.findingsRange,
  );

  const [recentScans, charts, overview, insights] = await Promise.all([
    prisma.scanJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { targetDomain: true },
    }),
    loadDashboardCharts(prisma, { scanRangeKey: scanRange, findingsRangeKey: findingsRange }),
    loadDashboardOverview(prisma, periodKey),
    loadDashboardInsights(prisma),
  ]);

  return (
    <>
      <TopBar breadcrumb="/ overview" />
      <main className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
        <div className="flex items-end justify-between gap-4">
          <DashboardGreeting />
          <DashboardPeriodMenu current={periodKey} siblingParams={periodSiblingParams} />
        </div>

        <div className="mt-8 space-y-8">
          <DashboardFailedScanAlert count={charts.recentFailedCount} />

          <DashboardStatCards stats={overview.stats} periodLabel={overview.period.label} />

          <DashboardInsightsRow data={insights} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <DashboardScanActivityChart
                buckets={charts.scanActivity}
                range={charts.scanRange}
                siblingParams={rangeParams}
              />
            </div>
            <DashboardScanStatusChart rows={charts.scanStatusBreakdown} />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <DashboardFindingsActivityChart
                buckets={charts.findingsActivity}
                range={charts.findingsRange}
                siblingParams={rangeParams}
              />
            </div>
            <DashboardApiKeyUsageChart rows={charts.apiKeyUsage} perKeyDailyCap={charts.perKeyDailyCap} />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="glass-panel rounded-2xl p-5 xl:col-span-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">Quick actions</div>
              <div className="mt-4 space-y-3">
                <Link
                  href="/scans"
                  className="shadow-clay block rounded-xl bg-gradient-to-r from-accent to-accent-dim px-4 py-3 text-center text-[13px] font-semibold text-void"
                >
                  New Scan
                </Link>
                <Link
                  href="/findings"
                  className="block rounded-xl border border-line px-4 py-3 text-center text-[13px] text-muted hover:bg-[var(--nav-hover-bg)] hover:text-cream"
                >
                  View Findings
                </Link>
                <Link
                  href="/settings?tab=network"
                  className="block rounded-xl border border-line px-4 py-3 text-center text-[13px] text-muted hover:bg-[var(--nav-hover-bg)] hover:text-cream"
                >
                  Configure API Keys
                </Link>
              </div>
            </div>

            <div className="glass-panel overflow-hidden rounded-2xl shadow-glass xl:col-span-2">
              <div className="border-b border-line bg-[var(--table-header-bg)] px-5 py-4">
                <div className="text-[13px] font-semibold text-cream">Recent scans</div>
                <div className="mt-1 text-[12px] text-muted">
                  Completed → results · Running → progress
                </div>
              </div>

              <div className="hidden border-b border-line bg-[var(--table-header-bg)] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted sm:grid sm:grid-cols-12 sm:gap-3">
                <div className="col-span-4">Target</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Phase</div>
                <div className="col-span-3 text-right">Created</div>
              </div>

              <div className="divide-y divide-line">
                {recentScans.length === 0 ? (
                  <div className="px-5 py-6 text-[13px] text-muted">No scans yet.</div>
                ) : (
                  recentScans.map((s) => {
                    const isCompleted = s.status === ScanJobStatus.COMPLETED;
                    const href = isCompleted ? `/scans/${s.id}/observed` : `/scans/${s.id}`;
                    const statusCls = STATUS_STYLE[s.status] ?? "bg-muted/10 text-muted";

                    return (
                      <Link
                        key={s.id}
                        href={href}
                        className="flex flex-col gap-2 px-5 py-3.5 transition-colors hover:bg-white/[0.03] sm:grid sm:grid-cols-12 sm:items-center sm:gap-3"
                      >
                        <div className="col-span-4 min-w-0">
                          <div className="truncate font-mono text-[12px] text-cream">
                            {s.targetDomain.domainNormalized}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${statusCls}`}
                          >
                            {s.status}
                          </span>
                        </div>
                        <div className="col-span-3 font-mono text-[11px] text-muted">
                          {s.phase ?? "—"}{" "}
                          {s.progressCurrent != null ? `(${s.progressCurrent}/${s.progressTotal ?? 0})` : ""}
                        </div>
                        <div className="col-span-3 text-right font-mono text-[11px] text-muted">
                          {s.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
