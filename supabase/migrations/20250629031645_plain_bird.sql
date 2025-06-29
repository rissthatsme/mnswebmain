/*
  # Add payment proof columns

  1. New Columns
    - Add `payment_proof` column to `students` table for storing payment proof URLs
    - Add `payment_proof` column to `update_requests` table for payment confirmation requests

  2. Storage
    - Create storage bucket for payment proofs
    - Set up storage policies for file access
*/

-- Add payment_proof column to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'payment_proof'
  ) THEN
    ALTER TABLE students ADD COLUMN payment_proof text;
  END IF;
END $$;

-- Add payment_proof column to update_requests table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'update_requests' AND column_name = 'payment_proof'
  ) THEN
    ALTER TABLE update_requests ADD COLUMN payment_proof text;
  END IF;
END $$;

-- Create storage bucket for payment proofs (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Anyone can view payment proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs');

CREATE POLICY "Authenticated users can upload payment proofs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Users can update their own payment proofs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'payment-proofs');

CREATE POLICY "Users can delete their own payment proofs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'payment-proofs');