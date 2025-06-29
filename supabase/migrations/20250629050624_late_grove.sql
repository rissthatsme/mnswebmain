/*
  # Simple Storage Setup for Payment Proofs

  1. Storage Policies
    - Enable authenticated users to upload payment proofs
    - Enable public read access for admin verification
    - Enable authenticated users to manage their files

  2. Notes
    - Storage bucket will be created via Supabase dashboard or client
    - Focus only on RLS policies that we can control
*/

-- Ensure RLS is enabled on storage.objects (safe to run multiple times)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "payment_proofs_insert" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_select" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_update" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_delete" ON storage.objects;

-- Policy: Allow authenticated users to upload files to payment-proofs bucket
CREATE POLICY "payment_proofs_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs');

-- Policy: Allow anyone to read files from payment-proofs bucket (for admin access)
CREATE POLICY "payment_proofs_select"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'payment-proofs');

-- Policy: Allow authenticated users to update files in payment-proofs bucket
CREATE POLICY "payment_proofs_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'payment-proofs');

-- Policy: Allow authenticated users to delete files in payment-proofs bucket
CREATE POLICY "payment_proofs_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'payment-proofs');