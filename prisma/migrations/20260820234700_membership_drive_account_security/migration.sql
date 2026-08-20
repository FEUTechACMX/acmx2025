-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AccountTokenKind" AS ENUM ('CLAIM', 'RESET');

-- CreateEnum
CREATE TYPE "BundleKind" AS ENUM ('SOLO', 'PARTNER', 'BUNDLE_5', 'BUNDLE_8');

-- CreateEnum
CREATE TYPE "ApplicationKind" AS ENUM ('NEW', 'RENEWAL');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "JOApplicationStatus" AS ENUM ('PENDING', 'SHORTLISTED', 'ACCEPTED', 'WAITLISTED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "membershipStatus" "MembershipStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "AccountToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "kind" "AccountTokenKind" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipApplication" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "payerUserId" TEXT NOT NULL,
    "bundle" "BundleKind" NOT NULL,
    "kind" "ApplicationKind" NOT NULL,
    "proofStorageKey" TEXT NOT NULL,
    "proofUploadedAt" TIMESTAMP(3) NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "MembershipApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipApplicationMember" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAsPending" BOOLEAN NOT NULL,

    CONSTRAINT "MembershipApplicationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeQuestion" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CommitteeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JOApplication" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "targetCommitteeId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "status" "JOApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "JOApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JOAnswer" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "JOAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewSlot" (
    "id" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "interviewerUserId" TEXT,
    "location" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewBooking" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slotId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,

    CONSTRAINT "InterviewBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountToken_tokenHash_key" ON "AccountToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AccountToken_userId_idx" ON "AccountToken"("userId");

-- CreateIndex
CREATE INDEX "MembershipApplication_status_idx" ON "MembershipApplication"("status");

-- CreateIndex
CREATE INDEX "MembershipApplication_payerUserId_idx" ON "MembershipApplication"("payerUserId");

-- CreateIndex
CREATE INDEX "MembershipApplicationMember_userId_idx" ON "MembershipApplicationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipApplicationMember_applicationId_userId_key" ON "MembershipApplicationMember"("applicationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommitteeQuestion_committeeId_order_key" ON "CommitteeQuestion"("committeeId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "JOApplication_userId_key" ON "JOApplication"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JOApplication_shareToken_key" ON "JOApplication"("shareToken");

-- CreateIndex
CREATE INDEX "JOApplication_status_idx" ON "JOApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "JOAnswer_applicationId_questionId_key" ON "JOAnswer"("applicationId", "questionId");

-- CreateIndex
CREATE INDEX "InterviewSlot_startsAt_idx" ON "InterviewSlot"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewBooking_applicationId_key" ON "InterviewBooking"("applicationId");

-- CreateIndex
CREATE INDEX "InterviewBooking_slotId_idx" ON "InterviewBooking"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewBooking_slotId_applicationId_key" ON "InterviewBooking"("slotId", "applicationId");

-- AddForeignKey
ALTER TABLE "AccountToken" ADD CONSTRAINT "AccountToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipApplication" ADD CONSTRAINT "MembershipApplication_payerUserId_fkey" FOREIGN KEY ("payerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipApplication" ADD CONSTRAINT "MembershipApplication_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipApplicationMember" ADD CONSTRAINT "MembershipApplicationMember_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "MembershipApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipApplicationMember" ADD CONSTRAINT "MembershipApplicationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeQuestion" ADD CONSTRAINT "CommitteeQuestion_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JOApplication" ADD CONSTRAINT "JOApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JOApplication" ADD CONSTRAINT "JOApplication_targetCommitteeId_fkey" FOREIGN KEY ("targetCommitteeId") REFERENCES "Committee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JOApplication" ADD CONSTRAINT "JOApplication_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JOAnswer" ADD CONSTRAINT "JOAnswer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JOApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JOAnswer" ADD CONSTRAINT "JOAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "CommitteeQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSlot" ADD CONSTRAINT "InterviewSlot_interviewerUserId_fkey" FOREIGN KEY ("interviewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSlot" ADD CONSTRAINT "InterviewSlot_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewBooking" ADD CONSTRAINT "InterviewBooking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "InterviewSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewBooking" ADD CONSTRAINT "InterviewBooking_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JOApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;


