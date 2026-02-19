
-- Create daily_usage table to track free tier limits
CREATE TABLE public.daily_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  voice_count INT NOT NULL DEFAULT 0,
  image_count INT NOT NULL DEFAULT 0,
  question_count INT NOT NULL DEFAULT 0,
  last_subscription_reminder DATE,
  UNIQUE(user_id, usage_date)
);

ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own usage" ON public.daily_usage
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create trial subscription for new users (modify handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'farmer');

  -- Auto-create 15-day trial subscription
  INSERT INTO public.subscriptions (user_id, plan, status, starts_at, expires_at)
  VALUES (NEW.id, 'trial', 'active', now(), now() + INTERVAL '15 days');
  
  RETURN NEW;
END;
$$;
