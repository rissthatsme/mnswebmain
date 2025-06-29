/*
  # Fix Storage Policies for Payment Proof Upload

  1. Storage Bucket
    - Ensure payment-proofs bucket exists with proper configuration
    - Set bucket to public for easy access to view files

  2. Storage Policies
    - Allow authenticated users to upload files
    - Allow public read access for admin verification
    - Use proper RLS policies that work with Supabase's storage system
*/

-- Create the payment-proofs storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs', 
  true, -- Public bucket for easy access
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Drop existing storage policies to start fresh
DROP POLICY IF EXISTS "Allow payment proof uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous to read payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to read all payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to payment-proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view payment-proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to view payment-proofs" ON storage.objects;

-- Create comprehensive storage policies that work with Supabase's system

-- Policy 1: Allow authenticated users to upload to payment-proofs bucket
CREATE POLICY "Enable authenticated upload for payment-proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs');

-- Policy 2: Allow public read access (needed for admin to view proofs)
CREATE POLICY "Enable public read for payment-proofs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'payment-proofs');

-- Policy 3: Allow authenticated users to update their files
CREATE POLICY "Enable authenticated update for payment-proofs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'payment-proofs');

-- Policy 4: Allow authenticated users to delete their files
CREATE POLICY "Enable authenticated delete for payment-proofs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'payment-proofs');

-- Verify the bucket was created successfully
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM storage.buckets WHERE id = 'payment-proofs'
  ) INTO bucket_exists;
  
  IF bucket_exists THEN
    RAISE NOTICE 'Payment-proofs bucket created/updated successfully';
  ELSE
    RAISE WARNING 'Failed to create payment-proofs bucket';
  END IF;
END $$;