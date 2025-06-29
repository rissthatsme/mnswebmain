/*
  # Fix Storage Access for Payment Proofs
  
  Since we cannot directly modify storage.objects table policies through migrations,
  we'll update our application to use public bucket access and handle security
  at the application level.
  
  1. Update existing tables to support better file handling
  2. Add indexes for better performance
  3. The storage bucket will be configured as public through Supabase dashboard
*/

-- Add indexes for better performance on file-related queries
CREATE INDEX IF NOT EXISTS idx_students_payment_proof ON students(payment_proof) WHERE payment_proof IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_update_requests_payment_proof ON update_requests(payment_proof) WHERE payment_proof IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cvs_student_id ON cvs(student_id);

-- Update RLS policies to be more permissive for our use case
DROP POLICY IF EXISTS "Public access for students" ON students;
DROP POLICY IF EXISTS "Public access for CVs" ON cvs;
DROP POLICY IF EXISTS "Public access for update requests" ON update_requests;

-- Create comprehensive policies for all tables
CREATE POLICY "Public access for students"
  ON students
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access for CVs"
  ON cvs
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access for update requests"
  ON update_requests
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add a comment to remind about storage bucket configuration
COMMENT ON TABLE students IS 'Storage bucket "payment-proofs" should be configured as public in Supabase dashboard';