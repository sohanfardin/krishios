
-- Create payment_requests table for manual payment verification
CREATE TABLE public.payment_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan text NOT NULL,
  transaction_id text NOT NULL,
  amount numeric NOT NULL,
  payment_method text DEFAULT 'bkash',
  status text DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  verified_at timestamp with time zone,
  notes text
);

-- Enable RLS
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own payment requests
CREATE POLICY "Users insert own payment requests"
ON public.payment_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own payment requests
CREATE POLICY "Users view own payment requests"
ON public.payment_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Create index on user_id and status for queries
CREATE INDEX idx_payment_requests_user_id ON public.payment_requests(user_id);
CREATE INDEX idx_payment_requests_status ON public.payment_requests(status);
