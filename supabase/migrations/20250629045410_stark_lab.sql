/*
  # Clear All Student Data

  1. Data Cleanup
    - Remove all existing students
    - Remove all CVs
    - Remove all update requests
    - Reset auto-increment sequences

  2. Fresh Start
    - Clean database ready for new registrations
    - All tables remain with proper structure
    - Policies and triggers intact
*/

-- Clear all existing data in the correct order (respecting foreign key constraints)
DELETE FROM update_requests;
DELETE FROM cvs;
DELETE FROM students;

-- Reset any sequences if they exist
-- Note: UUID primary keys don't use sequences, but this ensures clean state

-- Verify all tables are empty
DO $$
DECLARE
  student_count INTEGER;
  request_count INTEGER;
  cv_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO student_count FROM students;
  SELECT COUNT(*) INTO request_count FROM update_requests;
  SELECT COUNT(*) INTO cv_count FROM cvs;
  
  RAISE NOTICE 'Data cleared successfully:';
  RAISE NOTICE 'Students remaining: %', student_count;
  RAISE NOTICE 'Update Requests remaining: %', request_count;
  RAISE NOTICE 'CVs remaining: %', cv_count;
  
  IF student_count = 0 AND request_count = 0 AND cv_count = 0 THEN
    RAISE NOTICE 'All data successfully cleared. Database ready for fresh start.';
  ELSE
    RAISE WARNING 'Some data may still remain. Please check manually.';
  END IF;
END $$;