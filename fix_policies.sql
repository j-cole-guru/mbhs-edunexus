-- Security for the 'teachers' table
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated management for teachers" ON teachers;
CREATE POLICY "Allow authenticated management for teachers" ON teachers
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Security for 'students' table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated management for students" ON students;
CREATE POLICY "Allow authenticated management for students" ON students
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
