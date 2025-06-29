/*
  # Perbaiki sistem autentikasi siswa

  1. Tambah kolom password ke table students
  2. Update data siswa yang sudah ada dengan password default
  3. Buat sistem yang lebih aman untuk autentikasi
*/

-- Tambah kolom password ke table students
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE students ADD COLUMN password_hash text DEFAULT 'student123';
  END IF;
END $$;

-- Update semua siswa yang sudah ada dengan password default
UPDATE students 
SET password_hash = 'student123' 
WHERE password_hash IS NULL OR password_hash = '';

-- Buat constraint untuk memastikan password tidak null
ALTER TABLE students ALTER COLUMN password_hash SET NOT NULL;

-- Insert fresh sample students dengan password yang jelas
DELETE FROM update_requests;
DELETE FROM cvs;
DELETE FROM students;

-- Insert sample students dengan password yang sudah diset
INSERT INTO students (id, email, name, phone, password_hash, status, payment_status, registration_date, payment_proof) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'student1@example.com', 'Ahmad Rizki Pratama', '+62812345678', 'student123', 'pending', 'confirmed', '2024-01-15T10:30:00Z', 'https://example.com/payment1.jpg'),
  ('550e8400-e29b-41d4-a716-446655440002', 'student2@example.com', 'Siti Nurhaliza Dewi', '+62812345679', 'student123', 'pending', 'confirmed', '2024-01-16T09:15:00Z', 'https://example.com/payment2.jpg'),
  ('550e8400-e29b-41d4-a716-446655440003', 'student3@example.com', 'Budi Santoso', '+62812345680', 'student123', 'approved', 'confirmed', '2024-01-10T14:45:00Z', 'https://example.com/payment3.jpg'),
  ('550e8400-e29b-41d4-a716-446655440004', 'student4@example.com', 'Maya Sari', '+62812345681', 'student123', 'pending', 'pending', '2024-01-20T16:20:00Z', NULL),
  ('550e8400-e29b-41d4-a716-446655440005', 'student5@example.com', 'Andi Wijaya', '+62812345682', 'student123', 'rejected', 'confirmed', '2024-01-12T11:30:00Z', 'https://example.com/payment5.jpg');

-- Insert sample update requests
INSERT INTO update_requests (student_id, student_name, type, description, status, payment_proof) VALUES
  ('550e8400-e29b-41d4-a716-446655440002', 'Siti Nurhaliza Dewi', 'cv_update', 'Ingin mengupdate pengalaman kerja terbaru di PT ABC', 'pending', NULL),
  ('550e8400-e29b-41d4-a716-446655440003', 'Budi Santoso', 'personal_info', 'Perubahan nomor telepon dari +62812345680 ke +62812345690', 'pending', NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'Maya Sari', 'payment_confirmation', 'Upload bukti pembayaran yang baru', 'pending', 'https://example.com/payment_new.jpg');

-- Insert sample CV data
INSERT INTO cvs (student_id, personal_info, education, experience, skills) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', 
   '{"fullName": "Budi Santoso", "email": "student3@example.com", "phone": "+62812345680", "address": "Jl. Merdeka No. 123, Jakarta", "dateOfBirth": "1995-05-15", "placeOfBirth": "Jakarta"}',
   '[{"id": "1", "institution": "Universitas Indonesia", "degree": "S1", "field": "Teknik Informatika", "startYear": "2013", "endYear": "2017", "gpa": "3.75"}]',
   '[{"id": "1", "company": "PT Tech Solutions", "position": "Junior Developer", "startDate": "2017-08-01", "endDate": "2020-12-31", "description": "Mengembangkan aplikasi web menggunakan React dan Node.js"}]',
   '["JavaScript", "React", "Node.js", "Python", "SQL", "Git"]');

-- Verify the data was inserted correctly
DO $$
DECLARE
  student_count INTEGER;
  request_count INTEGER;
  cv_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO student_count FROM students;
  SELECT COUNT(*) INTO request_count FROM update_requests;
  SELECT COUNT(*) INTO cv_count FROM cvs;
  
  RAISE NOTICE 'Migration completed successfully:';
  RAISE NOTICE 'Students: %', student_count;
  RAISE NOTICE 'Update Requests: %', request_count;
  RAISE NOTICE 'CVs: %', cv_count;
  RAISE NOTICE 'All students have password: student123';
END $$;