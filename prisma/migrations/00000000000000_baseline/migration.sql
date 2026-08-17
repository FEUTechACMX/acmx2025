-- Baseline: the schema as it stood before the merchandise and committee work.
--
-- This file used to contain nothing but the comment "Database schema already
-- exists". That was true of the one database that existed at the time, and
-- false of every other one — a fresh clone, a CI database, or `prisma migrate
-- reset` produced a database with only the merch and committee tables, because
-- nothing in the migration history ever created User, Event, Registration,
-- Attendance or Session.
--
-- The DDL below was generated from a reconstruction of the pre-merchandise
-- schema, and the chain is verified: applying every migration in order against
-- an empty database now reproduces prisma/schema.prisma exactly.
--
-- Lesson and Schedule are created here and dropped again by
-- 20260817000000_drop_lesson_and_schedule. Migrations record history; they do
-- not get retconned.
--
-- Existing databases already have this migration recorded as applied, so
-- nothing here re-runs against them.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'JUNIOR_OFFICER', 'MEDIA_OFFICER', 'FINANCE_JUNIOR_OFFICER', 'SECRETARIAT_JUNIOR_OFFICER', 'SECRETARIAT', 'EXECUTIVES', 'EXECUTIVES_MEDIA', 'ADMIN');

-- CreateEnum
CREATE TYPE "EventSemester" AS ENUM ('1st', '2nd', '3rd');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('UPCOMING', 'ONGOING', 'FINISHED');

-- CreateEnum
CREATE TYPE "RegistrationRole" AS ENUM ('MEMBER', 'NON_MEMBER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ATTENDANCE', 'REWARDS', 'TASKS', 'PURCHASE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT,
    "studentId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "suffix" TEXT,
    "yearLevel" INTEGER NOT NULL,
    "degreeProgram" TEXT NOT NULL,
    "personalEmail" TEXT NOT NULL,
    "schoolEmail" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "facebookLink" TEXT NOT NULL,
    "discordName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eventSemester" "EventSemester" NOT NULL DEFAULT '1st',
    "venue" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceMember" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceNonMember" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "image" TEXT,
    "cardImage" TEXT,
    "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isMultiDay" BOOLEAN NOT NULL DEFAULT false,
    "statusOverride" "EventStatus",
    "type" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "overview" TEXT,
    "mainObjective" TEXT,
    "specificObjectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetParticipants" TEXT,
    "registrationFees" TEXT,
    "parentId" TEXT,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "professor" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "transaction_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "schoolEmail" TEXT NOT NULL,
    "imageURL" TEXT,
    "type" "TransactionType" NOT NULL,
    "points" INTEGER,
    "description" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "studentNumber" TEXT NOT NULL,
    "schoolEmail" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "facebookLink" TEXT NOT NULL,
    "yearLevel" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "professor" TEXT NOT NULL,
    "degreeProgram" TEXT NOT NULL,
    "role" "RegistrationRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "userId" TEXT,
    "eventId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "studentNumber" TEXT NOT NULL,
    "schoolEmail" TEXT NOT NULL,
    "yearLevel" INTEGER NOT NULL,
    "degreeProgram" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "professor" TEXT NOT NULL,
    "timeIn" TIMESTAMP(3) NOT NULL,
    "timeOut" TIMESTAMP(3),
    "role" "RegistrationRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "slideCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedVideo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "videoUrl" TEXT NOT NULL,
    "redirectUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseUserId_key" ON "User"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_studentId_key" ON "User"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_personalEmail_key" ON "User"("personalEmail");

-- CreateIndex
CREATE UNIQUE INDEX "User_schoolEmail_key" ON "User"("schoolEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_eventId_userId_key" ON "Registration"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_eventId_schoolEmail_key" ON "Registration"("eventId", "schoolEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_eventId_studentNumber_key" ON "Registration"("eventId", "studentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_registrationId_key" ON "Attendance"("registrationId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("studentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Event"("eventId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("eventId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

