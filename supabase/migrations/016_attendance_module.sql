-- Alter notification_type to include new attendance types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'attendance_late';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'attendance_absent';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'leave_requested';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'leave_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'leave_rejected';

-- Create enums
CREATE TYPE attendance_status AS ENUM ('on_time', 'late', 'early_exit', 'absent', 'permission', 'incomplete', 'no_schedule');
CREATE TYPE attendance_event_type AS ENUM ('check_in', 'lunch_start', 'lunch_end', 'check_out', 'note');
CREATE TYPE leave_type AS ENUM ('vacation', 'medical', 'personal', 'training', 'other');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');

-- Create employee_schedules table
CREATE TABLE employee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  expected_check_in TEXT NOT NULL,
  expected_lunch_start TEXT,
  expected_lunch_end TEXT,
  expected_check_out TEXT NOT NULL,
  late_tolerance INTEGER NOT NULL DEFAULT 15,
  work_days INTEGER[] NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create attendance_records table
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_at TIMESTAMPTZ,
  lunch_start_at TIMESTAMPTZ,
  lunch_end_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  status attendance_status NOT NULL,
  check_in_late_minutes INTEGER,
  lunch_overtime_minutes INTEGER,
  early_exit_minutes INTEGER,
  total_worked_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- Create attendance_events table
CREATE TABLE attendance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_record_id UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
  event_type attendance_event_type NOT NULL,
  happened_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create leave_requests table
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_date DATE NOT NULL,
  leave_type leave_type NOT NULL,
  reason TEXT NOT NULL,
  status leave_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approval_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, leave_date)
);

-- RLS Policies

ALTER TABLE employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- employee_schedules policies
CREATE POLICY "Schedules are viewable by everyone" ON employee_schedules FOR SELECT USING (true);
CREATE POLICY "Schedules are modifiable by admin/manager" ON employee_schedules FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- attendance_records policies
CREATE POLICY "Records are viewable by owner or admin/manager/readonly" ON attendance_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'readonly')) OR
  EXISTS (SELECT 1 FROM employees WHERE employees.id = employee_id AND employees.profile_id = auth.uid())
);
CREATE POLICY "Records are insertable by owner" ON attendance_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM employees WHERE employees.id = employee_id AND employees.profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
CREATE POLICY "Records are updatable by owner or admin/manager" ON attendance_records FOR UPDATE USING (
  EXISTS (SELECT 1 FROM employees WHERE employees.id = employee_id AND employees.profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- attendance_events policies
CREATE POLICY "Events are viewable by owner or admin/manager/readonly" ON attendance_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM attendance_records ar WHERE ar.id = attendance_record_id AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'readonly')) OR
    EXISTS (SELECT 1 FROM employees WHERE employees.id = ar.employee_id AND employees.profile_id = auth.uid())
  ))
);
CREATE POLICY "Events are insertable by owner" ON attendance_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM attendance_records ar WHERE ar.id = attendance_record_id AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')) OR
    EXISTS (SELECT 1 FROM employees WHERE employees.id = ar.employee_id AND employees.profile_id = auth.uid())
  ))
);

-- leave_requests policies
CREATE POLICY "Leave requests are viewable by owner or admin/manager/readonly" ON leave_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'readonly')) OR
  EXISTS (SELECT 1 FROM employees WHERE employees.id = employee_id AND employees.profile_id = auth.uid())
);
CREATE POLICY "Leave requests are insertable by owner" ON leave_requests FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM employees WHERE employees.id = employee_id AND employees.profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
CREATE POLICY "Leave requests are updatable by admin/manager" ON leave_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Add updated_at triggers
CREATE TRIGGER set_employee_schedules_updated_at BEFORE UPDATE ON employee_schedules FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();
CREATE TRIGGER set_attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();
CREATE TRIGGER set_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();
