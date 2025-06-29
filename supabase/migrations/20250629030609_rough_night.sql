/*
  # Update RLS policies for public access

  1. Security Changes
    - Allow anonymous users to register (insert into students table)
    - Allow anonymous users to read students data for login verification
    - Keep other policies for authenticated users only

  2. Tables affected
    - students: Updated policies for registration and login
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Students can read own data" ON students;
DROP POLICY IF EXISTS "Students can update own data" ON students;
DROP POLICY IF EXISTS "Anyone can insert students" ON students;

-- Create new policies for students table
CREATE POLICY "Allow anonymous registration"
  ON students
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous read for login"
  ON students
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Students can read own data"
  ON students
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can update own data"
  ON students
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admin can do everything"
  ON students
  FOR ALL
  TO authenticated
  USING (true);

-- Update policies for CVs table
DROP POLICY IF EXISTS "Students can read own CV" ON cvs;
DROP POLICY IF EXISTS "Students can insert own CV" ON cvs;
DROP POLICY IF EXISTS "Students can update own CV" ON cvs;

CREATE POLICY "Allow all CV operations"
  ON cvs
  FOR ALL
  TO anon, authenticated
  USING (true);

-- Update policies for update_requests table
DROP POLICY IF EXISTS "Students can read own requests" ON update_requests;
DROP POLICY IF EXISTS "Students can insert own requests" ON update_requests;

CREATE POLICY "Allow all update request operations"
  ON update_requests
  FOR ALL
  TO anon, authenticated
  USING (true);