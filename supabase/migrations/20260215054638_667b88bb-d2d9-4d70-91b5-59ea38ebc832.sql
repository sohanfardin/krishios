
-- Admin can read all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can read all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update subscriptions (approve/reject)
CREATE POLICY "Admins can update subscriptions"
ON public.subscriptions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert subscriptions
CREATE POLICY "Admins can insert subscriptions"
ON public.subscriptions FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can read all payment requests
CREATE POLICY "Admins can view all payment requests"
ON public.payment_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update payment requests (approve/reject)
CREATE POLICY "Admins can update payment requests"
ON public.payment_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all farms
CREATE POLICY "Admins can view all farms"
ON public.farms FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all crops
CREATE POLICY "Admins can view all crops"
ON public.crops FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all livestock
CREATE POLICY "Admins can view all livestock"
ON public.livestock FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all user roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all harvest records
CREATE POLICY "Admins can view all harvest records"
ON public.harvest_records FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all finance transactions
CREATE POLICY "Admins can view all finances"
ON public.finance_transactions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
