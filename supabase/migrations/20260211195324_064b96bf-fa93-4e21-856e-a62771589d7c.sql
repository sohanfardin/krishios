
-- Harvest records for crop production analysis
CREATE TABLE public.harvest_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES public.crops(id) ON DELETE SET NULL,
  crop_name TEXT NOT NULL,
  land_size NUMERIC NOT NULL DEFAULT 0,
  land_unit TEXT NOT NULL DEFAULT 'bigha',
  planting_date DATE,
  harvest_date DATE,
  total_production NUMERIC NOT NULL DEFAULT 0,
  production_unit TEXT NOT NULL DEFAULT 'kg',
  fertilizer_cost NUMERIC NOT NULL DEFAULT 0,
  labor_cost NUMERIC NOT NULL DEFAULT 0,
  irrigation_cost NUMERIC NOT NULL DEFAULT 0,
  medicine_cost NUMERIC NOT NULL DEFAULT 0,
  total_sale_price NUMERIC NOT NULL DEFAULT 0,
  season TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.harvest_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own harvest records"
  ON public.harvest_records FOR ALL
  USING (owns_farm(farm_id))
  WITH CHECK (owns_farm(farm_id));

CREATE TRIGGER update_harvest_records_updated_at
  BEFORE UPDATE ON public.harvest_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Livestock production daily logs
CREATE TABLE public.livestock_production_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  livestock_id UUID REFERENCES public.livestock(id) ON DELETE SET NULL,
  animal_type TEXT NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  production_amount NUMERIC NOT NULL DEFAULT 0,
  production_unit TEXT NOT NULL DEFAULT 'litre',
  feed_cost NUMERIC NOT NULL DEFAULT 0,
  medicine_cost NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC NOT NULL DEFAULT 0,
  animal_count INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.livestock_production_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own livestock logs"
  ON public.livestock_production_logs FOR ALL
  USING (owns_farm(farm_id))
  WITH CHECK (owns_farm(farm_id));
