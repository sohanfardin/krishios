
-- Fish Ponds table
CREATE TABLE public.fish_ponds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  pond_number integer NOT NULL DEFAULT 1,
  area_decimal numeric NOT NULL DEFAULT 0,
  depth_feet numeric DEFAULT NULL,
  water_source text DEFAULT NULL,
  fish_species text[] DEFAULT '{}',
  stocking_date date DEFAULT NULL,
  fingerling_count integer DEFAULT 0,
  fingerling_cost numeric DEFAULT 0,
  daily_feed_amount numeric DEFAULT 0,
  feed_cost numeric DEFAULT 0,
  current_avg_weight_g numeric DEFAULT 0,
  expected_sale_date date DEFAULT NULL,
  status text NOT NULL DEFAULT 'active',
  notes text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fish_ponds ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users manage own fish ponds" ON public.fish_ponds
  FOR ALL USING (owns_farm(farm_id)) WITH CHECK (owns_farm(farm_id));

CREATE POLICY "Admins can view all fish ponds" ON public.fish_ponds
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Fish production logs
CREATE TABLE public.fish_production_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  pond_id uuid REFERENCES public.fish_ponds(id) ON DELETE SET NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  avg_weight_g numeric DEFAULT 0,
  mortality_count integer DEFAULT 0,
  feed_amount_kg numeric DEFAULT 0,
  feed_cost numeric DEFAULT 0,
  medicine_cost numeric DEFAULT 0,
  water_quality_notes text DEFAULT NULL,
  notes text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fish_production_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own fish logs" ON public.fish_production_logs
  FOR ALL USING (owns_farm(farm_id)) WITH CHECK (owns_farm(farm_id));

CREATE POLICY "Admins can view all fish logs" ON public.fish_production_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on fish_ponds
CREATE TRIGGER update_fish_ponds_updated_at
  BEFORE UPDATE ON public.fish_ponds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
