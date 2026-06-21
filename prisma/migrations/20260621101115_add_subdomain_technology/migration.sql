-- AlterEnum
ALTER TYPE "EngineProvider" ADD VALUE 'WAPPALYZER';

-- AlterEnum
ALTER TYPE "ScanPhase" ADD VALUE 'T5B_WAPPALYZER';

-- CreateTable
CREATE TABLE "subdomain_technology" (
    "id" TEXT NOT NULL,
    "subdomain_id" TEXT NOT NULL,
    "scan_job_id" TEXT,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "categories" TEXT[],
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "icon_name" TEXT,
    "website" TEXT,
    "cpe" TEXT,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subdomain_technology_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subdomain_technology_subdomain_id_idx" ON "subdomain_technology"("subdomain_id");

-- CreateIndex
CREATE INDEX "subdomain_technology_scan_job_id_idx" ON "subdomain_technology"("scan_job_id");

-- CreateIndex
CREATE UNIQUE INDEX "subdomain_technology_subdomain_id_name_key" ON "subdomain_technology"("subdomain_id", "name");

-- AddForeignKey
ALTER TABLE "subdomain_technology" ADD CONSTRAINT "subdomain_technology_subdomain_id_fkey" FOREIGN KEY ("subdomain_id") REFERENCES "subdomain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
