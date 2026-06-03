import type { PrismaClient } from "@prisma/client";

export type ScanObservedCountSource = {
  id: string;
  observedFindingCount: number | null;
  observedSubdomainCount: number | null;
  observedUrlCount: number | null;
};

export async function resolveScanObservedCounts(
  prisma: PrismaClient,
  scan: ScanObservedCountSource,
): Promise<{ findings: number; subdomains: number; urls: number }> {
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
