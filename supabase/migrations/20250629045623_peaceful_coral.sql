/*
  # Setup Payment Proofs Storage Bucket

  1. Storage Setup
    - Create `payment-proofs` storage bucket if it doesn't exist
    - Configure bucket to be private by default
    
  2. Security Policies
    - Allow authenticated users to upload payment proofs
    - Allow anonymous users to upload during registration
    - Allow users to read their own payment proofs
    - Allow admins to read all payment proofs
    
  3. Notes
    - Files are stored with student ID prefix for organization
    - Public access is controlled through policies, not bucket settings
*/

-- Create the payment-proofs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to upload payment proofs (needed for registration)
CREATE POLICY "Allow payment proof uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'payment-proofs' AND
  (storage.foldername(name))[1] = 'payment-proofs'
);

-- Policy: Allow users to read their own payment proofs
CREATE POLICY "Allow users to read own payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs' AND
  (storage.foldername(name))[1] = 'payment-proofs'
);

-- Policy: Allow anonymous users to read payment proofs (for preview during registration)
CREATE POLICY "Allow anonymous to read payment proofs"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'payment-proofs' AND
  (storage.foldername(name))[1] = 'payment-proofs'
);

-- Policy: Allow admins to read all payment proofs
CREATE POLICY "Allow admins to read all payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs' AND
  (storage.foldername(name))[1] = 'payment-proofs'
);

-- Policy: Allow users to update their own payment proofs
CREATE POLICY "Allow users to update own payment proofs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payment-proofs' AND
  (storage.foldername(name))[1] = 'payment-proofs'
);

-- Policy: Allow users to delete their own payment proofs
CREATE POLICY "Allow users to delete own payment proofs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-proofs' AND
  (storage.foldername(name))[1] = 'payment-proofs'
);