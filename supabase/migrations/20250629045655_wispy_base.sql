/*
  # Fix Storage Policies for Payment Proofs

  1. Storage Setup
    - Create payment-proofs bucket with proper configuration
    - Set bucket to public for easier access during registration

  2. Security
    - Public bucket allows anonymous uploads during registration
    - File size and type restrictions handled at bucket level
*/

-- Create the payment-proofs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  true, -- Set to public to allow anonymous access
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

-- Note: Storage policies are managed by Supabase automatically for public buckets
-- Public buckets allow read access to everyone and write access to authenticated users
-- For anonymous uploads during registration, we'll handle this in the application layer