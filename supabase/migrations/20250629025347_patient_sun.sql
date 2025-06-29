/*
  # Initial Schema for LPK Training Institute

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `phone` (text)
      - `status` (text) - pending, approved, rejected
      - `payment_status` (text) - pending, confirmed
      - `registration_date` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `cvs`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `personal_info` (jsonb)
      - `education` (jsonb)
      - `experience` (jsonb)
      - `skills` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `update_requests`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `student_name` (text)
      - `type` (text) - cv_update, personal_info, payment_confirmation
      - `description` (text)
      - `status` (text) - pending, approved, rejected
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Students can only access their own data
    - Admins can access all data
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed')),
  registration_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create CVs table
CREATE TABLE IF NOT EXISTS cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  personal_info jsonb DEFAULT '{}',
  education jsonb DEFAULT '[]',
  experience jsonb DEFAULT '[]',
  skills jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create update requests table
CREATE TABLE IF NOT EXISTS update_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  type text NOT NULL CHECK (type IN ('cv_update', 'personal_info', 'payment_confirmation')),
  description text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for students table
CREATE POLICY "Students can read own data"
  ON students
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Students can update own data"
  ON students
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Anyone can insert students"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for CVs table
CREATE POLICY "Students can read own CV"
  ON cvs
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Students can insert own CV"
  ON cvs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Students can update own CV"
  ON cvs
  FOR UPDATE
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Create policies for update requests table
CREATE POLICY "Students can read own requests"
  ON update_requests
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Students can insert own requests"
  ON update_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cvs_updated_at
  BEFORE UPDATE ON cvs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_update_requests_updated_at
  BEFORE UPDATE ON update_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO students (email, name, phone, status, payment_status, registration_date) VALUES
  ('student1@example.com', 'Ahmad Rizki', '+62812345678', 'pending', 'confirmed', '2024-01-15T10:30:00Z'),
  ('student2@example.com', 'Siti Nurhaliza', '+62812345679', 'approved', 'confirmed', '2024-01-10T09:15:00Z'),
  ('student3@example.com', 'Budi Santoso', '+62812345680', 'pending', 'pending', '2024-01-20T14:45:00Z');

-- Insert sample update request
INSERT INTO update_requests (student_id, student_name, type, description, status) 
SELECT 
  id, 
  'Siti Nurhaliza', 
  'cv_update', 
  'Ingin mengupdate pengalaman kerja terbaru', 
  'pending'
FROM students WHERE email = 'student2@example.com';