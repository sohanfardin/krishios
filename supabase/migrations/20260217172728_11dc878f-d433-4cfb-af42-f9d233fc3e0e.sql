
-- Fix 1: Add admin-only UPDATE and DELETE policies for market_prices
CREATE POLICY "Admins update market prices"
ON public.market_prices
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete market prices"
ON public.market_prices
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Make profile-pictures bucket private and restrict to authenticated users
UPDATE storage.buckets SET public = false WHERE id = 'profile-pictures';

DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;

CREATE POLICY "Authenticated users view avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'profile-pictures' AND
  auth.role() = 'authenticated'
);
