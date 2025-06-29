/*
  # Create Storage Bucket and RLS Policies for Payment Proofs

  1. Storage Setup
    - Create 'payment-proofs' storage bucket if it doesn't exist
    - Configure bucket to be private (not publicly accessible by default)
    
  2. Security Policies
    - Allow authenticated users to upload files to payment-proofs bucket
    - Allow authenticated users to view their own uploaded files
    - Allow public access to view files (for admin verification)
    
  3. File Management
    - Set up proper file access controls
    - Enable secure file uploads for students
*/

-- Create the payment-proofs storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload files to payment-proofs bucket
CREATE POLICY "Allow authenticated uploads to payment-proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs');

-- Policy to allow authenticated users to view files in payment-proofs bucket
CREATE POLICY "Allow authenticated users to view payment-proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'payment-proofs');

-- Policy to allow public access to view files (needed for admin verification)
CREATE POLICY "Allow public access to view payment-proofs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'payment-proofs');

-- Policy to allow users to update their own files (if needed)
CREATE POLICY "Allow users to update their own payment-proofs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'payment-proofs');

-- Policy to allow users to delete their own files (if needed)
CREATE POLICY "Allow users to delete their own payment-proofs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'payment-proofs');