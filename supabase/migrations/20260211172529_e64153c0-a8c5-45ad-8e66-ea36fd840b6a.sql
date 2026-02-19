
-- Add onboarding fields to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS upazila text,
  ADD COLUMN IF NOT EXISTS farmer_type text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS land_size_category text,
  ADD COLUMN IF NOT EXISTS land_ownership text,
  ADD COLUMN IF NOT EXISTS irrigation_source text,
  ADD COLUMN IF NOT EXISTS farming_method text,
  ADD COLUMN IF NOT EXISTS biggest_challenges text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
