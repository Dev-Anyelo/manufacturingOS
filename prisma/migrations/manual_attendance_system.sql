-- Migration: Attendance System
-- Date: 2026-05-08
-- Description: Adds tables and enums for the attendance, scheduling, and leave request system.

-- 1. Create Enums
CREATE TYPE "AttendanceStatus" AS ENUM ('on_time', 'late', 'early_exit', 'absent', 'permission', 'incomplete', 'no_schedule');
CREATE TYPE "AttendanceEventType" AS ENUM ('check_in', 'lunch_start', 'lunch_end', 'check_out', 'note');
CREATE TYPE "LeaveType" AS ENUM ('vacation', 'medical', 'personal', 'training', 'other');
CREATE TYPE "LeaveStatus" AS ENUM ('pending', 'approved', 'rejected');

-- 2. Create Attendance Record Table
CREATE TABLE "AttendanceRecord" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employeeId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "lunchStartAt" TIMESTAMP(3),
    "lunchEndAt" TIMESTAMP(3),
    "totalWorkedMinutes" INTEGER,
    "checkInLateMinutes" INTEGER,
    "earlyExitMinutes" INTEGER,
    "lunchOvertimeMinutes" INTEGER,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'absent',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- 3. Create Attendance Event Table
CREATE TABLE "AttendanceEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attendanceRecordId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "AttendanceEvent_pkey" PRIMARY KEY ("id")
);

-- 4. Create Employee Schedule Table
CREATE TABLE "EmployeeSchedule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employeeId" UUID NOT NULL,
    "expectedCheckIn" TEXT NOT NULL,
    "expectedLunchStart" TEXT,
    "expectedLunchEnd" TEXT,
    "expectedCheckOut" TEXT NOT NULL,
    "lateTolerance" INTEGER NOT NULL DEFAULT 15,
    "workDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSchedule_pkey" PRIMARY KEY ("id")
);

-- 5. Create Leave Request Table
CREATE TABLE "LeaveRequest" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employeeId" UUID NOT NULL,
    "leaveDate" TIMESTAMP(3) NOT NULL,
    "leaveType" "LeaveType" NOT NULL DEFAULT 'personal',
    "reason" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'pending',
    "approvalNote" TEXT,
    "approvedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- 6. Add Foreign Keys
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AttendanceEvent" ADD CONSTRAINT "AttendanceEvent_attendanceRecordId_fkey" FOREIGN KEY ("attendanceRecordId") REFERENCES "AttendanceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeSchedule" ADD CONSTRAINT "EmployeeSchedule_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Add Unique Constraints
CREATE UNIQUE INDEX "AttendanceRecord_employeeId_date_key" ON "AttendanceRecord"("employeeId", "date");
CREATE UNIQUE INDEX "EmployeeSchedule_employeeId_key" ON "EmployeeSchedule"("employeeId");

-- 8. Add notification types
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'attendance_late';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'attendance_absent';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'leave_requested';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'leave_approved';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'leave_rejected';
