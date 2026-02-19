
-- Create OTP verification table
CREATE TABLE public.email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (service role) to manage, no direct client access
CREATE POLICY "No direct access" ON public.email_otps FOR ALL USING (false);

-- Index for quick lookups
CREATE INDEX idx_email_otps_email ON public.email_otps(email, otp_code);
