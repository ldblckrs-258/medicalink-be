-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateEnum
CREATE TYPE "public"."StaffRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DOCTOR');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('BOOKED', 'CONFIRMED', 'RESCHEDULED', 'IN_PROGRESS', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_STAFF', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."QuestionStatus" AS ENUM ('PENDING', 'ANSWERED', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."StaffAccount" (
    "id" SERIAL NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "email" CITEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."StaffRole" NOT NULL,
    "gender" "public"."Gender" NOT NULL DEFAULT 'UNKNOWN',
    "dateOfBirth" DATE,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Patient" (
    "id" VARCHAR(12) NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "phoneNumber" VARCHAR(15),
    "email" CITEXT,
    "dateOfBirth" DATE,
    "gender" "public"."Gender" NOT NULL DEFAULT 'UNKNOWN',
    "address" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Doctor" (
    "id" SERIAL NOT NULL,
    "staffAccountId" INTEGER NOT NULL,
    "degree" VARCHAR(100),
    "position" TEXT[],
    "introduction" TEXT,
    "memberships" TEXT[],
    "awards" TEXT[],
    "research" TEXT,
    "trainingProcess" TEXT[],
    "experience" TEXT[],
    "avatarUrl" TEXT,
    "portrait" TEXT,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Specialty" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkLocation" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlogCategory" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Blog" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "categoryId" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Schedule" (
    "id" SERIAL NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "workLocationId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "timeSlotStart" TIME(6) NOT NULL,
    "timeSlotEnd" TIME(6) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Appointment" (
    "id" SERIAL NOT NULL,
    "patientId" VARCHAR(12) NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "symptoms" TEXT,
    "notes" TEXT,
    "status" "public"."AppointmentStatus" NOT NULL DEFAULT 'BOOKED',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" SERIAL NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "patientId" TEXT,
    "rating" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Question" (
    "id" SERIAL NOT NULL,
    "specialtyId" INTEGER NOT NULL,
    "askerName" VARCHAR(100),
    "askerEmail" CITEXT,
    "title" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."QuestionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Answer" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DoctorSpecialty" (
    "doctorId" INTEGER NOT NULL,
    "specialtyId" INTEGER NOT NULL,

    CONSTRAINT "DoctorSpecialty_pkey" PRIMARY KEY ("doctorId","specialtyId")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffAccount_email_key" ON "public"."StaffAccount"("email");

-- CreateIndex
CREATE INDEX "Patient_email_idx" ON "public"."Patient"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_staffAccountId_key" ON "public"."Doctor"("staffAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_name_key" ON "public"."BlogCategory"("name");

-- CreateIndex
CREATE INDEX "Blog_categoryId_createdAt_idx" ON "public"."Blog"("categoryId", "createdAt");

-- CreateIndex
CREATE INDEX "Schedule_doctorId_date_idx" ON "public"."Schedule"("doctorId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_doctorId_workLocationId_date_timeSlotStart_timeSlo_key" ON "public"."Schedule"("doctorId", "workLocationId", "date", "timeSlotStart", "timeSlotEnd");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_scheduleId_key" ON "public"."Appointment"("scheduleId");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "public"."Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_status_createdAt_idx" ON "public"."Appointment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Review_doctorId_createdAt_idx" ON "public"."Review"("doctorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_questionId_key" ON "public"."Answer"("questionId");

-- AddForeignKey
ALTER TABLE "public"."Doctor" ADD CONSTRAINT "Doctor_staffAccountId_fkey" FOREIGN KEY ("staffAccountId") REFERENCES "public"."StaffAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Blog" ADD CONSTRAINT "Blog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."StaffAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Blog" ADD CONSTRAINT "Blog_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Schedule" ADD CONSTRAINT "Schedule_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Schedule" ADD CONSTRAINT "Schedule_workLocationId_fkey" FOREIGN KEY ("workLocationId") REFERENCES "public"."WorkLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "public"."Specialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Answer" ADD CONSTRAINT "Answer_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorSpecialty" ADD CONSTRAINT "DoctorSpecialty_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorSpecialty" ADD CONSTRAINT "DoctorSpecialty_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "public"."Specialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
