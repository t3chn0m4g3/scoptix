import { EngineProvider, FindingSource, type PrismaClient } from "@prisma/client";

export function findingFingerprintKey(parts: {
  discoveredUrlId: string;
  findingType: string;
  source: FindingSource;
  snippet: string | null;
}): string {
  return `${parts.discoveredUrlId}|${parts.findingType}|${parts.source}|${parts.snippet ?? ""}`;
}

export type ScanFindingIndex = Map<string, { id: string; engines: EngineProvider[] }>;

export async function loadScanFindingIndex(
  prisma: PrismaClient,
  scanJobId: string,
): Promise<ScanFindingIndex> {
  const rows = await prisma.analysisFinding.findMany({
    where: { scanJobId },
    select: {
      id: true,
      discoveredUrlId: true,
      findingType: true,
      source: true,
      snippet: true,
      engines: true,
    },
  });
  const index: ScanFindingIndex = new Map();
  for (const row of rows) {
    index.set(
      findingFingerprintKey({
        discoveredUrlId: row.discoveredUrlId,
        findingType: row.findingType,
        source: row.source,
        snippet: row.snippet,
      }),
      { id: row.id, engines: row.engines ?? [] },
    );
  }
  return index;
}

export type RecordScanFindingInput = {
  discoveredUrlId: string;
  targetDomainId: string;
  scanJobId: string;
  source: FindingSource;
  findingType: string;
  snippet: string;
  engine: EngineProvider;
};

/** Insert a finding or merge `engine` onto an existing row with the same scan fingerprint. */
export async function recordScanFinding(
  prisma: PrismaClient,
  index: ScanFindingIndex,
  input: RecordScanFindingInput,
): Promise<"created" | "merged" | "unchanged"> {
  const key = findingFingerprintKey({
    discoveredUrlId: input.discoveredUrlId,
    findingType: input.findingType,
    source: input.source,
    snippet: input.snippet,
  });

  const existing = index.get(key);
  if (existing) {
    if (existing.engines.includes(input.engine)) return "unchanged";
    const engines = [...existing.engines, input.engine];
    await prisma.analysisFinding.update({
      where: { id: existing.id },
      data: { engines },
    });
    existing.engines = engines;
    return "merged";
  }

  const created = await prisma.analysisFinding.create({
    data: {
      discoveredUrlId: input.discoveredUrlId,
      targetDomainId: input.targetDomainId,
      scanJobId: input.scanJobId,
      source: input.source,
      findingType: input.findingType,
      snippet: input.snippet,
      engines: [input.engine],
    },
  });
  index.set(key, { id: created.id, engines: [input.engine] });
  return "created";
}
