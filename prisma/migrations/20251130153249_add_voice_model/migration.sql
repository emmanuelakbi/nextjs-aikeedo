-- CreateEnum
CREATE TYPE "VoiceStatus" AS ENUM ('TRAINING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "voices" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sampleFileId" TEXT NOT NULL,
    "modelId" TEXT,
    "status" "VoiceStatus" NOT NULL DEFAULT 'TRAINING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "voices_workspaceId_idx" ON "voices"("workspaceId");

-- CreateIndex
CREATE INDEX "voices_status_idx" ON "voices"("status");

-- CreateIndex
CREATE INDEX "voices_sampleFileId_idx" ON "voices"("sampleFileId");

-- AddForeignKey
ALTER TABLE "voices" ADD CONSTRAINT "voices_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voices" ADD CONSTRAINT "voices_sampleFileId_fkey" FOREIGN KEY ("sampleFileId") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
