/*
  # Create storage bucket for payment proofs

  1. Storage Setup
    - Create payment-proofs bucket with public access
    - Set file size limit to 5MB
    - Allow common image formats

  Note: Storage RLS policies are managed by Supabase automatically
  when the bucket is set to public = true
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