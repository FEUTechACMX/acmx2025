-- CreateEnum
CREATE TYPE "CommitteeStatus" AS ENUM ('PUBLISHED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "CommitteeRecruiting" AS ENUM ('RECRUITING', 'FULL', 'NOT_YET');

-- CreateEnum
CREATE TYPE "CommitteeProjectStatus" AS ENUM ('IN_PROGRESS', 'REVIEW', 'SHIPPED');

-- CreateEnum
CREATE TYPE "CommitteeMemberRole" AS ENUM ('HEAD', 'CO_HEAD', 'MEMBER');

-- CreateTable
CREATE TABLE "Committee" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kicker" TEXT,
    "emblem" TEXT NOT NULL DEFAULT 'pen',
    "mandate" TEXT,
    "blurb" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "CommitteeStatus" NOT NULL DEFAULT 'PUBLISHED',
    "recruiting" "CommitteeRecruiting" NOT NULL DEFAULT 'NOT_YET',
    "openSeats" INTEGER NOT NULL DEFAULT 0,
    "callBody" TEXT,
    "callDeadline" TIMESTAMP(3),
    "applyUrl" TEXT,
    "contactEmail" TEXT,
    "formedYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Committee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeResponsibility" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CommitteeResponsibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeProject" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meta" TEXT,
    "status" "CommitteeProjectStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CommitteeProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeFact" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CommitteeFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeMember" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "roleLabel" TEXT,
    "position" "CommitteeMemberRole" NOT NULL DEFAULT 'MEMBER',
    "bio" TEXT,
    "photo" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CommitteeMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Committee_slug_key" ON "Committee"("slug");

-- CreateIndex
CREATE INDEX "CommitteeResponsibility_committeeId_idx" ON "CommitteeResponsibility"("committeeId");

-- CreateIndex
CREATE INDEX "CommitteeProject_committeeId_idx" ON "CommitteeProject"("committeeId");

-- CreateIndex
CREATE INDEX "CommitteeFact_committeeId_idx" ON "CommitteeFact"("committeeId");

-- CreateIndex
CREATE INDEX "CommitteeMember_committeeId_idx" ON "CommitteeMember"("committeeId");

-- CreateIndex
CREATE INDEX "CommitteeMember_userId_idx" ON "CommitteeMember"("userId");

-- AddForeignKey
ALTER TABLE "CommitteeResponsibility" ADD CONSTRAINT "CommitteeResponsibility_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeProject" ADD CONSTRAINT "CommitteeProject_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeFact" ADD CONSTRAINT "CommitteeFact_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
