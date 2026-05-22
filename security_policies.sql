-- 1. Create a function to extract the role from the user's JWT metadata
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
BEGIN
  RETURN auth.jwt() -> 'raw_user_meta_data' ->> 'role';
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Security for the 'students' table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin and Dept Admins can manage students" ON students;
CREATE POLICY "Admin and Dept Admins can manage students" ON students
  FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'teacher')) -- Ensure 'teacher' here is the role used by your Dept Admins
  WITH CHECK (get_user_role() IN ('admin', 'teacher'));

-- 3. Security for 'classes' table
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin and Dept Admins can manage classes" ON classes;
CREATE POLICY "Admin and Dept Admins can manage classes" ON classes
  FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'teacher'))
  WITH CHECK (get_user_role() IN ('admin', 'teacher'));

-- 4. Security for 'levels' table
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin and Dept Admins can manage levels" ON levels;
CREATE POLICY "Admin and Dept Admins can manage levels" ON levels
  FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'teacher'))
  WITH CHECK (get_user_role() IN ('admin', 'teacher'));

-- 5. Security for 'teachers' table
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin and Dept Admins can manage teachers" ON teachers;
CREATE POLICY "Admin and Dept Admins can manage teachers" ON teachers
  FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'teacher'))
  WITH CHECK (get_user_role() IN ('admin', 'teacher'));

-- 6. Security for 'terms' table
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin and Dept Admins can manage terms" ON terms;
CREATE POLICY "Admin and Dept Admins can manage terms" ON terms
  FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'teacher'))
  WITH CHECK (get_user_role() IN ('admin', 'teacher'));
